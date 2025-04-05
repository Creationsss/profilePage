import { lanyardConfig } from "@config/environment";
import { renderEjsTemplate } from "@helpers/ejs";
import { getLanyardData, handleReadMe } from "@helpers/lanyard";

const routeDef: RouteDef = {
	method: "GET",
	accepts: "*/*",
	returns: "text/html",
};

async function handler(request: ExtendedRequest): Promise<Response> {
	const { id } = request.params;
	const data: LanyardResponse = await getLanyardData(id);

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
	const readme: string | Promise<string> | null =
		await handleReadMe(presence);

	const ejsTemplateData: EjsTemplateData = {
		title: `${presence.discord_user.username || "Unknown"}`,
		username: presence.discord_user.username,
		status: presence.discord_status,
		activities: presence.activities,
		user: presence.discord_user,
		platform: {
			desktop: presence.active_on_discord_desktop,
			mobile: presence.active_on_discord_mobile,
			web: presence.active_on_discord_web,
		},
		instance,
		readme,
	};

	return await renderEjsTemplate("index", ejsTemplateData);
}

export { handler, routeDef };
