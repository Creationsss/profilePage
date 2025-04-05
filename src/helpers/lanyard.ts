import { lanyardConfig } from "@config/environment";
import { fetch } from "bun";
import { marked } from "marked";

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

export async function handleReadMe(data: LanyardData): Promise<string | null> {
	const userReadMe: string | null = data.kv?.readme;
	console.log("userReadMe", userReadMe);

	if (
		!userReadMe ||
		!userReadMe.toLowerCase().endsWith("readme.md") ||
		!userReadMe.startsWith("http")
	) {
		return null;
	}

	try {
		const res: Response = await fetch(userReadMe, {
			headers: {
				Accept: "text/markdown",
			},
		});

		const contentType: string = res.headers.get("content-type") || "";
		if (
			!res.ok ||
			!(
				contentType.includes("text/markdown") ||
				contentType.includes("text/plain")
			)
		)
			return null;

		if (res.headers.has("content-length")) {
			const size: number = parseInt(
				res.headers.get("content-length") || "0",
				10,
			);
			if (size > 1024 * 100) return null;
		}

		const text: string = await res.text();
		if (!text || text.length < 10) return null;

		return marked.parse(text);
	} catch {
		return null;
	}
}
