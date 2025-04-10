import { fetch } from "bun";
import { Vibrant } from "node-vibrant/node";

export async function getImageColors(
	url: string,
	hex?: boolean,
): Promise<ImageColorResult | null> {
	if (!url) return null;

	if (typeof url !== "string" || !url.startsWith("http")) return null;

	let res: Response;
	try {
		res = await fetch(url);
	} catch {
		return null;
	}

	if (!res.ok) return null;

	const type: string | null = res.headers.get("content-type");
	if (!type?.startsWith("image/")) return null;

	const buffer: Buffer = Buffer.from(await res.arrayBuffer());
	const base64: string = buffer.toString("base64");
	const colors: Palette = await Vibrant.from(buffer).getPalette();

	return {
		img: `data:${type};base64,${base64}`,
		colors: hex
			? {
					Muted: rgbToHex(safeRgb(colors.Muted)),
					LightVibrant: rgbToHex(safeRgb(colors.LightVibrant)),
					Vibrant: rgbToHex(safeRgb(colors.Vibrant)),
					LightMuted: rgbToHex(safeRgb(colors.LightMuted)),
					DarkVibrant: rgbToHex(safeRgb(colors.DarkVibrant)),
					DarkMuted: rgbToHex(safeRgb(colors.DarkMuted)),
				}
			: colors,
	};
}

function safeRgb(swatch: Swatch | null | undefined): number[] {
	return Array.isArray(swatch?.rgb) ? (swatch.rgb ?? [0, 0, 0]) : [0, 0, 0];
}

export function rgbToHex(rgb: number[]): string {
	return `#${rgb.map((c) => Math.round(c).toString(16).padStart(2, "0")).join("")}`;
}
