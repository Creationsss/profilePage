import { lanyardConfig } from "@config/environment";
import { renderEjsTemplate } from "@helpers/ejs";
import { getLanyardData, handleReadMe } from "@helpers/lanyard";

const routeDef: RouteDef = {
	method: "GET",
	accepts: "*/*",
	returns: "text/html",
};

async function handler(): Promise<Response> {
	const data: LanyardResponse = await getLanyardData();

	if (!data.success) {
		return await renderEjsTemplate("error", {
			message: data.error.message,
		});
	}

	let instance: string = lanyardConfig.instance;

	if (instance.endsWith("/")) {
		instance = instance.slice(0, -1);
	}

	if (instance.startsWith("http://") || instance.startsWith("https://")) {
		instance = instance.slice(instance.indexOf("://") + 3);
	}

	const presence: LanyardData = data.data;
	const readme: string | Promise<string> | null = await handleReadMe(presence);

	let status: string;
	if (presence.activities.some((activity) => activity.type === 1)) {
		status = "streaming";
	} else {
		status = presence.discord_status;
	}

	console.log(presence.kv.rain);

	const ejsTemplateData: EjsTemplateData = {
		title: presence.discord_user.global_name || presence.discord_user.username,
		username:
			presence.discord_user.global_name || presence.discord_user.username,
		status: status,
		activities: presence.activities,
		user: presence.discord_user,
		platform: {
			desktop: presence.active_on_discord_desktop,
			mobile: presence.active_on_discord_mobile,
			web: presence.active_on_discord_web,
		},
		instance,
		readme,
		allowSnow: presence.kv.snow === "true",
		allowRain: presence.kv.rain === "true",
	};

	console.log("allowSnow", presence.kv.snow);
	console.log("allowRain", presence.kv.rain);

	return await renderEjsTemplate("index", ejsTemplateData);
}

export { handler, routeDef };
