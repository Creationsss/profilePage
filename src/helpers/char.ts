export function timestampToReadable(timestamp?: number): string {
	const date: Date =
		timestamp && !Number.isNaN(timestamp) ? new Date(timestamp) : new Date();
	if (Number.isNaN(date.getTime())) return "Invalid Date";
	return date.toISOString().replace("T", " ").replace("Z", "");
}
