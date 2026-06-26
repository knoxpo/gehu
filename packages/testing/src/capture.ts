// Record actions + state patches for assertions (md §16). Mutates the given
// store instance — use on a createTestStore() instance, not a shared singleton.

import type { CleanupFn, StateOf, Store } from "@gehu-js/core";
import { isMutation } from "@gehu-js/core";

type Dict = Record<string, unknown>;
const META = new Set(["snapshot", "getState", "subscribe"]);

export type ActionCapture = { actions: string[]; stop(): void };

/** Wrap action methods to record their names when called. */
export function captureActions<T>(store: Store<T>): ActionCapture {
	const actions: string[] = [];
	const s = store as unknown as Dict;
	const stateKeys = new Set(Object.keys((s.getState as () => Dict)()));
	const originals = new Map<string, (...args: unknown[]) => unknown>();

	for (const key of Object.keys(s)) {
		const value = s[key];
		if (typeof value !== "function") continue;
		if (stateKeys.has(key) || META.has(key) || isMutation(value)) continue; // skip accessors/meta/mutations
		const original = value as (...args: unknown[]) => unknown;
		originals.set(key, original);
		s[key] = (...args: unknown[]) => {
			actions.push(key);
			return original(...args);
		};
	}

	return {
		actions,
		stop: () => {
			for (const [key, original] of originals) s[key] = original;
		},
	};
}

export type PatchCapture<T> = {
	patches: Array<Partial<StateOf<T>>>;
	stop: CleanupFn;
};

/** Record the shallow diff of state on every change. Flush effects to collect. */
export function capturePatches<T>(store: Store<T>): PatchCapture<T> {
	const patches: Array<Partial<StateOf<T>>> = [];
	let prev = store.getState() as Dict;
	const unsub = store.subscribe((next) => {
		const n = next as Dict;
		const patch: Dict = {};
		for (const key of Object.keys(n)) {
			if (!Object.is(n[key], prev[key])) patch[key] = n[key];
		}
		patches.push(patch as Partial<StateOf<T>>);
		prev = n;
	});
	return { patches, stop: unsub };
}
