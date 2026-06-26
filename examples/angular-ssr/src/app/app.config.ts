import { type ApplicationConfig, inject, TransferState } from "@angular/core";
import { provideClientHydration } from "@angular/platform-browser";
import { provideRouter } from "@angular/router";
import { GEHU_HYDRATION, provideGehu } from "@gehu/angular";
import { routes } from "./app.routes";
import { GEHU_KEY } from "./hydration-key";

export const appConfig: ApplicationConfig = {
	providers: [
		provideRouter(routes),
		provideClientHydration(),
		provideGehu(),
		// Client: seed Gehu from the state the server transferred, so the first
		// paint already shows the server value (no flash back to defaults).
		{
			provide: GEHU_HYDRATION,
			useFactory: () => inject(TransferState).get(GEHU_KEY, {}),
		},
	],
};
