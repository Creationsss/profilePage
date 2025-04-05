import type { Server } from "bun";

type Query = Record<string, string>;
type Params = Record<string, string>;

declare global {
	type BunServer = Server;

	interface ExtendedRequest extends Request {
		startPerf: number;
		query: Query;
		params: Params;
	}
}
