import { redisTtl } from "@config/environment";
import { fetch } from "bun";
import { redis } from "bun";

const routeDef: RouteDef = {
	method: "GET",
	accepts: "*/*",
	returns: "*/*",
	log: false,
};

async function fetchAndCacheCss(url: string): Promise<string | null> {
	const cacheKey = `css:${url}`;
	const cached = await redis.get(cacheKey);
	if (cached) return cached;

	const res = await fetch(url, {
		headers: {
			Accept: "text/css",
		},
	});

	if (!res.ok) return null;

	if (res.headers.has("content-length")) {
		const size = Number.parseInt(res.headers.get("content-length") || "0", 10);
		if (size > 1024 * 50) return null;
	}

	const text = await res.text();
	if (!text || text.length < 5) return null;

	const sanitized = text
		.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
		.replace(/@import\s+url\(['"]?(.*?)['"]?\);?/gi, "");

	await redis.set(cacheKey, sanitized);
	await redis.expire(cacheKey, redisTtl);

	return sanitized;
}

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

	const sanitized = await fetchAndCacheCss(url);

	if (!sanitized) {
		return Response.json(
			{
				success: false,
				error: {
					code: "FETCH_FAILED",
					message: "Failed to fetch or sanitize CSS",
				},
			},
			{ status: 400 },
		);
	}

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
