import { badgeApi, lanyardConfig } from "@config/environment";
import { renderEjsTemplate } from "@helpers/ejs";

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

	const ejsTemplateData: EjsTemplateData = {
		title: "Discord Profile",
		username: "",
		user: { id: id || lanyardConfig.userId },
		instance: instance,
		badgeApi: badgeApi,
		avatar: `https://cdn.discordapp.com/embed/avatars/${Math.floor(Math.random() * 5)}.png`,
		extraOptions: {},
	};

	return await renderEjsTemplate("index", ejsTemplateData);
}

export { handler, routeDef };
