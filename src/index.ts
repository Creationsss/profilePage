import { logger } from "@helpers/logger";

import { serverHandler } from "@/server";

async function main(): Promise<void> {
	try {
		serverHandler.initialize();
	} catch (error) {
		throw error;
	}
}

main().catch((error: Error) => {
	logger.error(["Error initializing the server:", error]);
	process.exit(1);
});
