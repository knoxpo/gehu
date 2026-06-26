import type { ApplicationConfig } from "@angular/core";
import { provideGehu } from "@gehu-js/angular";
import "@gehu-js/devtools"; // registers the `devtools: true` shorthand

export const appConfig: ApplicationConfig = {
	providers: [provideGehu({ devtools: true })],
};
