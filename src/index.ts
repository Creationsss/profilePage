import { logger } from "@helpers/logger";

import { serverHandler } from "@/server";

async function main(): Promise<void> {
	serverHandler.initialize();
}

main().catch((error: Error) => {
	logger.error(["Error initializing the server:", error]);
	process.exit(1);
});
