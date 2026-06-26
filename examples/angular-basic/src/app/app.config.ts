import type { ApplicationConfig } from "@angular/core";
import { provideGehu } from "@gehu/angular";
import "@gehu/devtools"; // registers the `devtools: true` shorthand

export const appConfig: ApplicationConfig = {
	providers: [provideGehu({ devtools: true })],
};
