import { resolve } from "node:path";
import { echo } from "@atums/echo";
import { environment } from "@config/environment";
import {
	type BunFile,
	FileSystemRouter,
	type MatchedRoute,
	type Serve,
} from "bun";

import { webSocketHandler } from "@/websocket";

class ServerHandler {
	private router: FileSystemRouter;

	constructor(
		private port: number,
		private host: string,
	) {
		this.router = new FileSystemRouter({
			style: "nextjs",
			dir: "./src/routes",
			fileExtensions: [".ts"],
			origin: `http://${this.host}:${this.port}`,
		});
	}

	public initialize(): void {
		const server: Serve = Bun.serve({
			port: this.port,
			hostname: this.host,
			fetch: this.handleRequest.bind(this),
			websocket: {
				open: webSocketHandler.handleOpen.bind(webSocketHandler),
				message: webSocketHandler.handleMessage.bind(webSocketHandler),
				close: webSocketHandler.handleClose.bind(webSocketHandler),
			},
		});

		const accessUrls: string[] = [
			`http://${server.hostname}:${server.port}`,
			`http://localhost:${server.port}`,
			`http://127.0.0.1:${server.port}`,
		];

		echo.info(`Server running at ${accessUrls[0]}`);
		echo.info(`Access via: ${accessUrls[1]} or ${accessUrls[2]}`);

		this.logRoutes();
	}

	private logRoutes(): void {
		echo.info("Available routes:");

		const sortedRoutes: [string, string][] = Object.entries(
			this.router.routes,
		).sort(([pathA]: [string, string], [pathB]: [string, string]) =>
			pathA.localeCompare(pathB),
		);

		for (const [path, filePath] of sortedRoutes) {
			echo.info(`Route: ${path}, File: ${filePath}`);
		}
	}

	private async serveStaticFile(
		request: ExtendedRequest,
		pathname: string,
		ip: string,
	): Promise<Response> {
		let filePath: string;
		let response: Response;

		try {
			if (pathname === "/favicon.ico") {
				filePath = resolve("public", "assets", "favicon.ico");
			} else {
				filePath = resolve(`.${pathname}`);
			}

			const file: BunFile = Bun.file(filePath);

			if (await file.exists()) {
				const fileContent: ArrayBuffer = await file.arrayBuffer();
				const contentType: string = file.type || "application/octet-stream";

				response = new Response(fileContent, {
					headers: { "Content-Type": contentType },
				});
			} else {
				echo.warn(`File not found: ${filePath}`);
				response = new Response("Not Found", { status: 404 });
			}
		} catch (error) {
			echo.error({
				message: `Error serving static file: ${pathname}`,
				error: error as Error,
			});
			response = new Response("Internal Server Error", { status: 500 });
		}

		this.logRequest(request, response, ip);
		return response;
	}

	private logRequest(
		request: ExtendedRequest,
		response: Response,
		ip: string | undefined,
	): void {
		const pathname = new URL(request.url).pathname;

		const ignoredStartsWith: string[] = ["/public"];
		const ignoredPaths: string[] = ["/favicon.ico"];

		if (
			ignoredStartsWith.some((prefix) => pathname.startsWith(prefix)) ||
			ignoredPaths.includes(pathname)
		) {
			return;
		}

		echo.custom(`${request.method}`, `${response.status}`, [
			request.url,
			`${(performance.now() - request.startPerf).toFixed(2)}ms`,
			ip || "unknown",
		]);
	}

	private async handleRequest(
		request: Request,
		server: BunServer,
	): Promise<Response> {
		const extendedRequest: ExtendedRequest = request as ExtendedRequest;
		extendedRequest.startPerf = performance.now();

		const headers = request.headers;
		let ip = server.requestIP(request)?.address;
		let response: Response;

		if (!ip || ip.startsWith("172.") || ip === "127.0.0.1") {
			ip =
				headers.get("CF-Connecting-IP")?.trim() ||
				headers.get("X-Real-IP")?.trim() ||
				headers.get("X-Forwarded-For")?.split(",")[0].trim() ||
				"unknown";
		}

		const pathname: string = new URL(request.url).pathname;

		const baseDir = resolve("public/custom");
		const customPath = resolve(baseDir, pathname.slice(1));

		if (!customPath.startsWith(baseDir)) {
			return new Response("Forbidden", { status: 403 });
		}

		const customFile = Bun.file(customPath);
		if (await customFile.exists()) {
			const content = await customFile.arrayBuffer();
			const type = customFile.type || "application/octet-stream";
			response = new Response(content, {
				headers: { "Content-Type": type },
			});
			this.logRequest(extendedRequest, response, ip);
			return response;
		}

		if (pathname.startsWith("/public") || pathname === "/favicon.ico") {
			return await this.serveStaticFile(extendedRequest, pathname, ip);
		}

		const match: MatchedRoute | null = this.router.match(request);
		let requestBody: unknown = {};

		if (match) {
			const { filePath, params, query } = match;

			try {
				const routeModule: RouteModule = await import(filePath);
				const contentType: string | null = request.headers.get("Content-Type");
				const actualContentType: string | null = contentType
					? contentType.split(";")[0].trim()
					: null;

				if (
					routeModule.routeDef.needsBody === "json" &&
					actualContentType === "application/json"
				) {
					try {
						requestBody = await request.json();
					} catch {
						requestBody = {};
					}
				} else if (
					routeModule.routeDef.needsBody === "multipart" &&
					actualContentType === "multipart/form-data"
				) {
					try {
						requestBody = await request.formData();
					} catch {
						requestBody = {};
					}
				}

				if (
					(Array.isArray(routeModule.routeDef.method) &&
						!routeModule.routeDef.method.includes(request.method)) ||
					(!Array.isArray(routeModule.routeDef.method) &&
						routeModule.routeDef.method !== request.method)
				) {
					response = Response.json(
						{
							success: false,
							code: 405,
							error: `Method ${request.method} Not Allowed, expected ${
								Array.isArray(routeModule.routeDef.method)
									? routeModule.routeDef.method.join(", ")
									: routeModule.routeDef.method
							}`,
						},
						{ status: 405 },
					);
				} else {
					const expectedContentType: string | string[] | null =
						routeModule.routeDef.accepts;

					let matchesAccepts: boolean;

					if (Array.isArray(expectedContentType)) {
						matchesAccepts =
							expectedContentType.includes("*/*") ||
							expectedContentType.includes(actualContentType || "");
					} else {
						matchesAccepts =
							expectedContentType === "*/*" ||
							actualContentType === expectedContentType;
					}

					if (!matchesAccepts) {
						response = Response.json(
							{
								success: false,
								code: 406,
								error: `Content-Type ${actualContentType} Not Acceptable, expected ${
									Array.isArray(expectedContentType)
										? expectedContentType.join(", ")
										: expectedContentType
								}`,
							},
							{ status: 406 },
						);
					} else {
						extendedRequest.params = params;
						extendedRequest.query = query;

						response = await routeModule.handler(
							extendedRequest,
							requestBody,
							server,
						);

						if (routeModule.routeDef.returns !== "*/*") {
							response.headers.set(
								"Content-Type",
								routeModule.routeDef.returns,
							);
						}
					}
				}
			} catch (error: unknown) {
				echo.error({
					message: `Error handling route ${request.url}`,
					error: error,
				});

				response = Response.json(
					{
						success: false,
						code: 500,
						error: "Internal Server Error",
					},
					{ status: 500 },
				);
			}
		} else {
			response = Response.json(
				{
					success: false,
					code: 404,
					error: "Not Found",
				},
				{ status: 404 },
			);
		}

		this.logRequest(extendedRequest, response, ip);
		return response;
	}
}

const serverHandler: ServerHandler = new ServerHandler(
	environment.port,
	environment.host,
);

export { serverHandler };
