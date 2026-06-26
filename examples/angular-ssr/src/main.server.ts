import {
	type BootstrapContext,
	bootstrapApplication,
} from "@angular/platform-browser";
import { AppComponent } from "./app/app.component";
import { config } from "./app/app.config.server";

// Angular 20 SSR requires the BootstrapContext to be threaded through.
const bootstrap = (context: BootstrapContext) =>
	bootstrapApplication(AppComponent, config, context);

export default bootstrap;
