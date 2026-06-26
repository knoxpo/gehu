import {
	type ApplicationConfig,
	inject,
	mergeApplicationConfig,
	TransferState,
} from "@angular/core";
import { provideServerRendering, withRoutes } from "@angular/ssr";
import { GEHU_HYDRATION } from "@gehu-js/angular";
import { appConfig } from "./app.config";
import { serverRoutes } from "./app.routes.server";
import { GEHU_KEY } from "./hydration-key";

const serverConfig: ApplicationConfig = {
	providers: [
		provideServerRendering(withRoutes(serverRoutes)),
		// Server: compute initial state per request, hand it to Gehu, and stash it
		// in TransferState so the client picks up the same values.
		{
			provide: GEHU_HYDRATION,
			useFactory: () => {
				const transferState = inject(TransferState);
				const data = { counter: { count: 42 } }; // pretend this came from a request/db
				transferState.set(GEHU_KEY, data);
				return data;
			},
		},
	],
};

export const config = mergeApplicationConfig(appConfig, serverConfig);
