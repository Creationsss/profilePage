import { redisTtl } from "@config/environment";
import { fetch } from "bun";
import { redis } from "bun";
import { marked } from "marked";

const routeDef: RouteDef = {
	method: "GET",
	accepts: "*/*",
	returns: "*/*",
	log: false,
};

async function addLazyLoading(html: string): Promise<string> {
	return new HTMLRewriter()
		.on("img", {
			element(el) {
				el.setAttribute("loading", "lazy");
			},
		})
		.transform(html);
}

async function fetchAndCacheReadme(url: string): Promise<string | null> {
	const cacheKey = `readme:${url}`;
	const cached = await redis.get(cacheKey);
	if (cached) return cached;

	const res = await fetch(url, {
		headers: {
			Accept: "text/markdown",
		},
	});

	if (!res.ok) return null;

	if (res.headers.has("content-length")) {
		const size = Number.parseInt(res.headers.get("content-length") || "0", 10);
		if (size > 1024 * 100) return null;
	}

	const text = await res.text();
	if (!text || text.length < 10) return null;

	const html = /\.(html?|htm)$/i.test(url) ? text : await marked.parse(text);

	const safe = await addLazyLoading(html);

	await redis.set(cacheKey, safe);
	await redis.expire(cacheKey, redisTtl);

	return safe;
}

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

	const safe = await fetchAndCacheReadme(url);

	if (!safe) {
		return Response.json(
			{
				success: false,
				error: {
					code: "FETCH_FAILED",
					message: "Failed to fetch or process file",
				},
			},
			{ status: 400 },
		);
	}

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
