import { lanyardConfig } from "@config/environment";
import { renderEjsTemplate } from "@helpers/ejs";
import { getLanyardData } from "@helpers/lanyard";

const routeDef: RouteDef = {
	method: "GET",
	accepts: "*/*",
	returns: "text/html",
};

async function handler(): Promise<Response> {
	const data: LanyardResponse = await getLanyardData();

	if (!data.success) {
		return Response.json(data.error, {
			status: 500,
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
	const ejsTemplateData: EjsTemplateData = {
		title: "User Page",
		username: presence.discord_user.username,
		status: presence.discord_status,
		activities: presence.activities,
		user: presence.discord_user,

		platform: {
			desktop: presence.active_on_discord_desktop,
			mobile: presence.active_on_discord_mobile,
			web: presence.active_on_discord_web,
		},

		instance: instance,
	};

	return await renderEjsTemplate("index", ejsTemplateData);
}

export { handler, routeDef };
