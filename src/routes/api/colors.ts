import { fetch } from "bun";
import { Vibrant } from "node-vibrant/node";

type Palette = Awaited<ReturnType<typeof Vibrant.prototype.getPalette>>;

const routeDef: RouteDef = {
	method: "GET",
	accepts: "*/*",
	returns: "application/json",
};

async function handler(request: ExtendedRequest): Promise<Response> {
	const { url } = request.query;

	if (!url) {
		return Response.json({ error: "URL is required" }, { status: 400 });
	}

	if (typeof url !== "string" || !url.startsWith("http")) {
		return Response.json({ error: "Invalid URL" }, { status: 400 });
	}

	let res: Response;
	try {
		res = await fetch(url);
	} catch {
		return Response.json({ error: "Failed to fetch image" }, { status: 500 });
	}

	if (!res.ok) {
		return Response.json(
			{ error: "Image fetch returned error" },
			{ status: res.status },
		);
	}

	const type: string | null = res.headers.get("content-type");
	if (!type?.startsWith("image/")) {
		return Response.json({ error: "Not an image" }, { status: 400 });
	}

	const buffer: Buffer = Buffer.from(await res.arrayBuffer());
	const base64: string = buffer.toString("base64");
	const colors: Palette = await Vibrant.from(buffer).getPalette();

	const payload: {
		img: string;
		colors: Palette;
	} = {
		img: `data:${type};base64,${base64}`,
		colors,
	};

	const compressed: Uint8Array = Bun.gzipSync(JSON.stringify(payload));

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
