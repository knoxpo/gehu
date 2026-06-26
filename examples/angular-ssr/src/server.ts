import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
	AngularNodeAppEngine,
	createNodeRequestHandler,
	isMainModule,
	writeResponseToNodeResponse,
} from "@angular/ssr/node";
import express from "express";

const serverDistFolder = dirname(fileURLToPath(import.meta.url));
const browserDistFolder = resolve(serverDistFolder, "../browser");

const app = express();
// Angular 20 SSRF protection rejects unknown Host headers. Allow localhost for
// the local demo; in production set the real host(s) or the NG_ALLOWED_HOSTS env.
const angularApp = new AngularNodeAppEngine({ allowedHosts: ["localhost", "127.0.0.1"] });

app.use(
	express.static(browserDistFolder, {
		maxAge: "1y",
		index: false,
		redirect: false,
	}),
);

// All other routes are rendered by Angular.
app.use((req, res, next) => {
	angularApp
		.handle(req)
		.then((response) => (response ? writeResponseToNodeResponse(response, res) : next()))
		.catch(next);
});

if (isMainModule(import.meta.url)) {
	const port = process.env.PORT || 4000;
	app.listen(port, () => console.log(`Node Express server listening on http://localhost:${port}`));
}

export const reqHandler = createNodeRequestHandler(app);
