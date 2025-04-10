type RouteDef = {
	method: string | string[];
	accepts: string | null | string[];
	returns: string;
	needsBody?: "multipart" | "json";
};

type RouteModule = {
	handler: (
		request: Request | ExtendedRequest,
		requestBody: unknown,
		server: BunServer,
	) => Promise<Response> | Response;
	routeDef: RouteDef;
};

type Palette = Awaited<ReturnType<typeof Vibrant.prototype.getPalette>>;
type Swatch = Awaited<ReturnType<typeof Vibrant.prototype.getSwatches>>;
type ImageColorResult = {
	img: string;
	colors: Palette | Record<string, string>;
};
