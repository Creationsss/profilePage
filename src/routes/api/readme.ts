import { fetch } from "bun";
import DOMPurify from "isomorphic-dompurify";
import { marked } from "marked";

const routeDef: RouteDef = {
	method: "GET",
	accepts: "*/*",
	returns: "*/*",
	log: false,
};

async function handler(request: ExtendedRequest): Promise<Response> {
	const { url } = request.query;

	if (
		!url ||
		!url.startsWith("http") ||
		!/\.(md|markdown|txt|html?)$/i.test(url)
	) {
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
			Accept: "text/markdown",
		},
	});

	if (!res.ok) {
		return Response.json(
			{
				success: false,
				error: {
					code: "FETCH_FAILED",
					message: "Failed to fetch the file",
				},
			},
			{ status: 400 },
		);
	}

	if (res.headers.has("content-length")) {
		const size = Number.parseInt(res.headers.get("content-length") || "0", 10);
		if (size > 1024 * 100) {
			return Response.json(
				{
					success: false,
					error: {
						code: "FILE_TOO_LARGE",
						message: "File size exceeds 100KB limit",
					},
				},
				{ status: 400 },
			);
		}
	}

	const text = await res.text();
	if (!text || text.length < 10) {
		return Response.json(
			{
				success: false,
				error: {
					code: "INVALID_CONTENT",
					message: "File is too small or invalid",
				},
			},
			{ status: 400 },
		);
	}

	let html: string;

	if (
		url.toLowerCase().endsWith(".html") ||
		url.toLowerCase().endsWith(".htm")
	) {
		html = text;
	} else {
		html = await marked.parse(text);
	}

	const safe = DOMPurify.sanitize(html) || "";

	return new Response(safe, {
		headers: {
			"Content-Type": "text/html; charset=utf-8",
			"Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
			Pragma: "no-cache",
			Expires: "0",
		},
		status: 200,
	});
}

export { handler, routeDef };
