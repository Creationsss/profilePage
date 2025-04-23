import { logger } from "@creations.works/logger";

import { serverHandler } from "@/server";

async function main(): Promise<void> {
	serverHandler.initialize();
}

main().catch((error: Error) => {
	logger.error(["Error initializing the server:", error]);
	process.exit(1);
});

if (process.env.IN_PTERODACTYL === "true") {
	console.log("Server Started");
}
