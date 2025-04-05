import { Vibrant } from "node-vibrant/node";

const routeDef: RouteDef = {
	method: "GET",
	accepts: "*/*",
	returns: "application/json",
};

async function handler(request: ExtendedRequest): Promise<Response> {
	const req = await fetch(request.query.url);

	if (!req.ok) {
		return Response.json({ error: "Failed to fetch image" }, { status: 500 });
	}

	const type = req.headers.get("content-type")
	if (!type?.includes("image/")) {
		return Response.json({ error: "Not an image" }, { status: 400 });
	}

	const imageBuffer = await req.arrayBuffer()

	const colors = await Vibrant.from(Buffer.from(imageBuffer)).getPalette();

	return new Response(Bun.gzipSync(JSON.stringify({
		img: `data:${type};base64,${Buffer.from(imageBuffer).toString("base64")}`,
		colors,
	})), {
		headers: {
			"Content-Type": "application/json",
			"Content-Encoding": "gzip",
			"Cache-Control": "public, max-age=31536000, immutable",
		}
	})
}

export { handler, routeDef };
