// Framework- and runner-agnostic test store (md §16). Imports only @gehu-js/core.

import type { CleanupFn, StateOf, Store, StoreMutation, StoreResource } from "@gehu-js/core";
import { buildStore, getStoreDef } from "@gehu-js/core";

type Dict = Record<string, unknown>;

export type TestStoreOptions<T extends object> = {
	/** Seed initial state (merged over the store's defaults). */
	hydrate?: Partial<StateOf<T>>;
	/** Replace named resources with mocks (see mockResource). */
	resources?: Record<string, StoreResource<unknown>>;
	/** Replace named mutations with mocks (see mockMutation). */
	mutations?: Record<string, StoreMutation<unknown, unknown>>;
};

export type TestStore<T extends object> = {
	value: Store<T>;
	snapshot(): StateOf<T>;
	getState(): StateOf<T>;
	subscribe(listener: (state: StateOf<T>) => void): CleanupFn;
};

/** Build a fresh, isolated instance of a store for a test (md §16). */
export function createTestStore<T extends object>(
	store: Store<T>,
	options: TestStoreOptions<T> = {},
): TestStore<T> {
	const def = getStoreDef(store);
	const hydrate = options.hydrate
		? { ...(store.snapshot() as object), ...options.hydrate }
		: def?.config.hydrate;
	// Fresh instance when we have the recipe; otherwise fall back to the given store.
	const instance = def ? buildStore<T>(def.factory, { ...def.config, hydrate }) : store;

	const v = instance as unknown as Dict;
	for (const [key, mock] of Object.entries(options.resources ?? {})) v[key] = mock;
	for (const [key, mock] of Object.entries(options.mutations ?? {})) v[key] = mock;

	return {
		value: instance,
		snapshot: () => instance.snapshot(),
		getState: () => instance.getState(),
		subscribe: (listener) => instance.subscribe(listener),
	};
}

/** Same mechanism for linkedStore (it now carries the recipe too). */
export const createLinkedTestStore = createTestStore;
