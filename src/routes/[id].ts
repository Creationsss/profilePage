import { resolve } from "node:path";
import {
	badgeApi,
	lanyardConfig,
	plausibleScript,
	reviewDb,
	timezoneAPIUrl,
} from "@config/environment";
import { file } from "bun";

const routeDef: RouteDef = {
	method: "GET",
	accepts: "*/*",
	returns: "text/html",
};

async function handler(request: ExtendedRequest): Promise<Response> {
	const { id } = request.params;
	const instance = lanyardConfig.instance
		.replace(/^https?:\/\//, "")
		.replace(/\/$/, "");

	const path = resolve("src", "views", "index.html");
	const bunFile = file(path);

	const html = new HTMLRewriter()
		.on("head", {
			element(head) {
				head.setAttribute("data-user-id", id || lanyardConfig.userId);
				head.setAttribute("data-instance-uri", instance);
				head.setAttribute("data-badge-url", badgeApi || "");

				if (reviewDb.enabled) {
					head.setAttribute("data-review-db", reviewDb.url);
				}

				if (timezoneAPIUrl) {
					head.setAttribute("data-timezone-api", timezoneAPIUrl);
				}

				if (plausibleScript) {
					head.append(plausibleScript, { html: true });
				}
			},
		})
		.transform(await bunFile.text());

	return new Response(html, {
		headers: {
			"Content-Type": "text/html",
		},
	});
}

export { handler, routeDef };
