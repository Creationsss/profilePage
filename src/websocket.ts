import { logger } from "@creations.works/logger";
import type { ServerWebSocket } from "bun";

class WebSocketHandler {
	public handleMessage(ws: ServerWebSocket, message: string): void {
		logger.info(`WebSocket received: ${message}`);
		try {
			ws.send(`You said: ${message}`);
		} catch (error) {
			logger.error(["WebSocket send error", error as Error]);
		}
	}

	public handleOpen(ws: ServerWebSocket): void {
		logger.info("WebSocket connection opened.");
		try {
			ws.send("Welcome to the WebSocket server!");
		} catch (error) {
			logger.error(["WebSocket send error", error as Error]);
		}
	}

	public handleClose(ws: ServerWebSocket, code: number, reason: string): void {
		logger.warn(`WebSocket closed with code ${code}, reason: ${reason}`);
	}
}

const webSocketHandler: WebSocketHandler = new WebSocketHandler();

export { webSocketHandler };
