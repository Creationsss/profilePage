import { handler as idHandler, routeDef as idRouteDef } from "./[id]";

export const routeDef = {
	...idRouteDef,
};

export const handler = async (
	request: ExtendedRequest,
	body: unknown,
	server: BunServer,
) => {
	return await idHandler(request);
};
