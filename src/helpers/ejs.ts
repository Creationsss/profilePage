import { resolve } from "node:path";
import { renderFile } from "ejs";

export async function renderEjsTemplate(
	viewName: string | string[],
	data: EjsTemplateData,
	headers?: Record<string, string | number | boolean>,
): Promise<Response> {
	let templatePath: string;

	if (Array.isArray(viewName)) {
		templatePath = resolve("src", "views", ...viewName);
	} else {
		templatePath = resolve("src", "views", viewName);
	}

	if (!templatePath.endsWith(".ejs")) {
		templatePath += ".ejs";
	}

	const html: string = await renderFile(templatePath, data);

	return new Response(html, {
		headers: { "Content-Type": "text/html", ...headers },
	});
}
