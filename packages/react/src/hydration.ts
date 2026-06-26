// Server-safe SSR helper (no React, no "use client"). Snapshot stores on the
// server, transfer to the client, feed to <GehuProvider hydrate={...}>.
import type { Store } from "@gehu-js/core";

/** Map of name → store.snapshot(), keyed so the registry matches by config.name. */
export function dehydrate(stores: Record<string, Store<unknown>>): Record<string, unknown> {
	const out: Record<string, unknown> = {};
	for (const [name, store] of Object.entries(stores)) {
		out[name] = store.snapshot();
	}
	return out;
}
