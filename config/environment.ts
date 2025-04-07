export const environment: Environment = {
	port: Number.parseInt(process.env.PORT || "8080", 10),
	host: process.env.HOST || "0.0.0.0",
	development:
		process.env.NODE_ENV === "development" || process.argv.includes("--dev"),
};

export const lanyardConfig: LanyardConfig = {
	userId: process.env.LANYARD_USER_ID || "",
	instance: process.env.LANYARD_INSTANCE || "https://api.lanyard.rest",
};
