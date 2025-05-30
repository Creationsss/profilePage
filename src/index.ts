import { serverHandler } from "@/server";
import { echo } from "@atums/echo";
import { verifyRequiredVariables } from "@config/environment";

async function main(): Promise<void> {
	verifyRequiredVariables();
	serverHandler.initialize();
}

main().catch((error: Error) => {
	echo.error({ message: "Error initializing the server", error });
	process.exit(1);
});

if (process.env.IN_PTERODACTYL === "true") {
	console.log("Server Started");
}
