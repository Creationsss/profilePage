import { fetch } from "bun";

const routeDef: RouteDef = {
	method: "GET",
	accepts: "*/*",
	returns: "*/*",
	log: false,
};

async function handler(request: ExtendedRequest): Promise<Response> {
	const { url } = request.query;

	if (!url || !url.startsWith("http") || !/\.css$/i.test(url)) {
		return Response.json(
			{
				success: false,
				error: {
					code: "INVALID_URL",
					message: "Invalid URL provided",
				},
			},
			{ status: 400 },
		);
	}

	const res = await fetch(url, {
		headers: {
			Accept: "text/css",
		},
	});

	if (!res.ok) {
		return Response.json(
			{
				success: false,
				error: {
					code: "FETCH_FAILED",
					message: "Failed to fetch CSS file",
				},
			},
			{ status: 400 },
		);
	}

	if (res.headers.has("content-length")) {
		const size = Number.parseInt(res.headers.get("content-length") || "0", 10);
		if (size > 1024 * 50) {
			return Response.json(
				{
					success: false,
					error: {
						code: "FILE_TOO_LARGE",
						message: "CSS file exceeds 50KB limit",
					},
				},
				{ status: 400 },
			);
		}
	}

	const text = await res.text();
	if (!text || text.length < 5) {
		return Response.json(
			{
				success: false,
				error: {
					code: "INVALID_CONTENT",
					message: "CSS content is too small or invalid",
				},
			},
			{ status: 400 },
		);
	}

	const sanitized = text
		.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
		.replace(/@import\s+url\(['"]?(.*?)['"]?\);?/gi, "");

	return new Response(sanitized, {
		headers: {
			"Content-Type": "text/css",
			"Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
			Pragma: "no-cache",
			Expires: "0",
		},
		status: 200,
	});
}

export { handler, routeDef };
