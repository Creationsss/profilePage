import { redisTtl, steamGridDbKey } from "@config/environment";
import { logger } from "@helpers/logger";
import { redis } from "bun";

if (!steamGridDbKey) {
	logger.warn("[SteamGridDB] Route disabled: Missing API key");
}

const routeDef: RouteDef = {
	method: "GET",
	accepts: "*/*",
	returns: "application/json",
};

async function fetchSteamGridIcon(gameName: string): Promise<string | null> {
	const cacheKey = `steamgrid:icon:${gameName.toLowerCase()}`;
	const cached = await redis.get(cacheKey);
	if (cached) return cached;

	const search = await fetch(`https://www.steamgriddb.com/api/v2/search/autocomplete/${encodeURIComponent(gameName)}`, {
		headers: {
			Authorization: `Bearer ${steamGridDbKey}`,
		},
	});

	if (!search.ok) return null;

	const { data } = await search.json();
	if (!data?.length) return null;

	const gameId = data[0]?.id;
	if (!gameId) return null;

	const iconRes = await fetch(`https://www.steamgriddb.com/api/v2/icons/game/${gameId}`, {
		headers: {
			Authorization: `Bearer ${steamGridDbKey}`,
		},
	});

	if (!iconRes.ok) return null;

	const iconData = await iconRes.json();
	const icon = iconData?.data?.[0]?.url ?? null;

	if (icon) {
		await redis.set(cacheKey, icon);
		await redis.expire(cacheKey, redisTtl);
	}
	return icon;
}

async function handler(request: ExtendedRequest): Promise<Response> {
	if (!steamGridDbKey) {
		return Response.json(
			{ status: 503, error: "Route disabled due to missing SteamGridDB key" },
			{ status: 503 }
		);
	}

	const { game } = request.params;

	if (!game || typeof game !== "string" || game.length < 2) {
		return Response.json({ status: 400, error: "Missing or invalid game name" }, { status: 400 });
	}

	const icon = await fetchSteamGridIcon(game);

	if (!icon) {
		return Response.json({ status: 404, error: "Icon not found" }, { status: 404 });
	}

	return Response.json(
		{
			status: 200,
			game,
			icon,
		},
		{ status: 200 }
	);
}

export { handler, routeDef };
