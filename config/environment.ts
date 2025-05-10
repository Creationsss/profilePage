export const environment: Environment = {
	port: Number.parseInt(process.env.PORT || "8080", 10),
	host: process.env.HOST || "0.0.0.0",
	development:
		process.env.NODE_ENV === "development" || process.argv.includes("--dev"),
};

export const redisTtl: number = process.env.REDIS_TTL
	? Number.parseInt(process.env.REDIS_TTL, 10)
	: 60 * 60 * 1; // 1 hour

export const lanyardConfig: LanyardConfig = {
	userId: process.env.LANYARD_USER_ID || "",
	instance: process.env.LANYARD_INSTANCE || "https://api.lanyard.rest",
};

export const reviewDb = {
	enabled: process.env.REVIEW_DB === "true" || process.env.REVIEW_DB === "1",
	url: "https://manti.vendicated.dev/api/reviewdb",
};

export const badgeApi: string | null = process.env.BADGE_API_URL || null;
export const steamGridDbKey: string | undefined =
	process.env.STEAMGRIDDB_API_KEY;

export const plausibleScript: string | null =
	process.env.PLAUSIBLE_SCRIPT_HTML?.trim() || null;
