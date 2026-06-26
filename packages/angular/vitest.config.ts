import { resolve } from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		environment: "jsdom",
		globals: true,
		setupFiles: ["./test-setup.ts"],
	},
	// Resolve the `.js` specifiers in our ESM source to the `.ts` files.
	resolve: {
		alias: {
			"@gehu-js/angular/ngrx-compat": resolve(__dirname, "./src/ngrx-compat/index.ts"),
			"@gehu-js/angular": resolve(__dirname, "./src/index.ts"),
			"@gehu-js/core": resolve(__dirname, "../core/src/index.ts"),
		},
		extensions: [".ts", ".js", ".json"],
	},
});
