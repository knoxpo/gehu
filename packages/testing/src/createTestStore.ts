// Framework- and runner-agnostic test store (md §16). Imports only @gehu/core.

import type {
	CleanupFn,
	StateOf,
	Store,
	StoreMutation,
	StoreResource,
} from "@gehu/core";
import { buildStore, getStoreDef } from "@gehu/core";

type Dict = Record<string, unknown>;

export type TestStoreOptions<T> = {
	/** Seed initial state (merged over the store's defaults). */
	hydrate?: Partial<StateOf<T>>;
	/** Replace named resources with mocks (see mockResource). */
	resources?: Record<string, StoreResource<unknown>>;
	/** Replace named mutations with mocks (see mockMutation). */
	mutations?: Record<string, StoreMutation<unknown, unknown>>;
};

export type TestStore<T> = {
	value: Store<T>;
	snapshot(): StateOf<T>;
	getState(): StateOf<T>;
	subscribe(listener: (state: StateOf<T>) => void): CleanupFn;
};

/** Build a fresh, isolated instance of a store for a test (md §16). */
export function createTestStore<T>(
	store: Store<T>,
	options: TestStoreOptions<T> = {},
): TestStore<T> {
	const def = getStoreDef(store);
	const hydrate = options.hydrate
		? { ...(store.snapshot() as object), ...options.hydrate }
		: def?.config.hydrate;
	// Fresh instance when we have the recipe; otherwise fall back to the given store.
	const instance = def
		? buildStore<T>(def.factory, { ...def.config, hydrate })
		: store;

	const v = instance as unknown as Dict;
	for (const [key, mock] of Object.entries(options.resources ?? {}))
		v[key] = mock;
	for (const [key, mock] of Object.entries(options.mutations ?? {}))
		v[key] = mock;

	return {
		value: instance,
		snapshot: () => instance.snapshot(),
		getState: () => instance.getState(),
		subscribe: (listener) => instance.subscribe(listener),
	};
}

/** Same mechanism for linkedStore (it now carries the recipe too). */
export const createLinkedTestStore = createTestStore;
