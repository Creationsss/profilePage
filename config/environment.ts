import { echo } from "@atums/echo";

const environment: Environment = {
	port: Number.parseInt(process.env.PORT || "8080", 10),
	host: process.env.HOST || "0.0.0.0",
	development:
		process.env.NODE_ENV === "development" || process.argv.includes("--dev"),
};

const redisTtl: number = process.env.REDIS_TTL
	? Number.parseInt(process.env.REDIS_TTL, 10)
	: 60 * 60 * 1; // 1 hour

const lanyardConfig: LanyardConfig = {
	userId: process.env.LANYARD_USER_ID || "",
	instance: process.env.LANYARD_INSTANCE || "",
};

const reviewDb = {
	enabled: process.env.REVIEW_DB === "true" || process.env.REVIEW_DB === "1",
	url: "https://manti.vendicated.dev/api/reviewdb",
};

const timezoneAPIUrl: string | null = process.env.TIMEZONE_API_URL || null;

const badgeApi: string | null = process.env.BADGE_API_URL || null;
const steamGridDbKey: string | undefined = process.env.STEAMGRIDDB_API_KEY;

const plausibleScript: string | null =
	process.env.PLAUSIBLE_SCRIPT_HTML?.trim() || null;

function verifyRequiredVariables(): void {
	const requiredVariables = [
		"HOST",
		"PORT",

		"LANYARD_USER_ID",
		"LANYARD_INSTANCE",
	];

	let hasError = false;

	for (const key of requiredVariables) {
		const value = process.env[key];
		if (value === undefined || value.trim() === "") {
			echo.error(`Missing or empty environment variable: ${key}`);
			hasError = true;
		}
	}

	if (hasError) {
		process.exit(1);
	}
}

export {
	environment,
	lanyardConfig,
	redisTtl,
	reviewDb,
	timezoneAPIUrl,
	badgeApi,
	steamGridDbKey,
	plausibleScript,
	verifyRequiredVariables,
};
