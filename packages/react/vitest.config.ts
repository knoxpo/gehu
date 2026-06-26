import { resolve } from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
	esbuild: { jsx: "automatic" },
	test: {
		environment: "jsdom",
		globals: true,
	},
	resolve: {
		alias: {
			"@gehu-js/react/server": resolve(__dirname, "./src/server.ts"),
			"@gehu-js/react": resolve(__dirname, "./src/index.ts"),
			"@gehu-js/core": resolve(__dirname, "../core/src/index.ts"),
		},
		extensions: [".ts", ".tsx", ".js", ".json"],
	},
});
