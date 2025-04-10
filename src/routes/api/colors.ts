import { getImageColors } from "@helpers/colors";

const routeDef: RouteDef = {
	method: "GET",
	accepts: "*/*",
	returns: "application/json",
};

async function handler(request: ExtendedRequest): Promise<Response> {
	const { url } = request.query;

	const result: ImageColorResult | null = await getImageColors(url, true);
	await getImageColors(url);

	if (!result) {
		return new Response("Invalid URL", {
			status: 400,
			headers: {
				"Content-Type": "application/json",
				"Cache-Control": "no-store",
				"Access-Control-Allow-Origin": "*",
			},
		});
	}

	const compressed: Uint8Array = Bun.gzipSync(JSON.stringify(result));

	return new Response(compressed, {
		headers: {
			"Content-Type": "application/json",
			"Content-Encoding": "gzip",
			"Cache-Control": "public, max-age=31536000, immutable",
			"Access-Control-Allow-Origin": "*",
		},
	});
}

export { handler, routeDef };
