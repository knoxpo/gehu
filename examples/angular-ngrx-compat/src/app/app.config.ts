import { type ApplicationConfig, provideZonelessChangeDetection } from "@angular/core";
import { provideGehu, provideStore } from "@gehu/angular";
import { CounterStore } from "./counter.store";
import { UsersStore } from "./users.store";

export const appConfig: ApplicationConfig = {
	providers: [
		provideZonelessChangeDetection(),
		provideGehu({ zoneless: true }),
		provideStore(CounterStore),
		provideStore(UsersStore),
	],
};
