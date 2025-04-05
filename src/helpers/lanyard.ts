import { lanyardConfig } from "@config/environment";
import { fetch } from "bun";

export async function getLanyardData(id?: string): Promise<LanyardResponse> {
	let instance: string = lanyardConfig.instance;

	if (instance.endsWith("/")) {
		instance = instance.slice(0, -1);
	}

	if (!instance.startsWith("http://") && !instance.startsWith("https://")) {
		instance = `https://${instance}`;
	}

	const url: string = `${instance}/v1/users/${id || lanyardConfig.userId}`;
	const res: Response = await fetch(url, {
		headers: {
			"Content-Type": "application/json",
			Accept: "application/json",
		},
	});

	if (!res.ok) {
		return {
			success: false,
			error: {
				code: "API_ERROR",
				message: `Lanyard API responded with status ${res.status}`,
			},
		};
	}

	const data: LanyardResponse = (await res.json()) as LanyardResponse;

	if (!data.success) {
		return {
			success: false,
			error: {
				code: "API_ERROR",
				message: "Failed to fetch valid Lanyard data",
			},
		};
	}

	return data;
}
