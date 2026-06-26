// SSR hydration helpers (md §13). On the server, snapshot stores into a plain
// object (pair with Angular TransferState); on the client, pass it to
// GEHU_HYDRATION so the registry seeds each store's initial state.
import type { Store } from "@gehu/core";

/** Map of name → store.snapshot(). Key by each store's config.name so the
 *  registry (which looks up by name) can match it on the client. */
export function dehydrate(
	stores: Record<string, Store<unknown>>,
): Record<string, unknown> {
	const out: Record<string, unknown> = {};
	for (const [name, store] of Object.entries(stores)) {
		out[name] = store.snapshot();
	}
	return out;
}
