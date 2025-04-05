export function timestampToReadable(timestamp?: number): string {
	const date: Date =
		timestamp && !isNaN(timestamp) ? new Date(timestamp) : new Date();
	if (isNaN(date.getTime())) return "Invalid Date";
	return date.toISOString().replace("T", " ").replace("Z", "");
}
