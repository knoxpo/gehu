// linkedStore (md §9): coordinates two or more stores. Owns its own
// coordination state; reads/acts across the linked stores via `stores.x`.
import { EMITTER, STORE_DEF } from "./brand.js";
import { buildStore } from "./createStore.js";
import type {
	Emitter,
	Factory,
	InferLinkedFactory,
	LinkedFactory,
	Store,
	StoreConfig,
} from "./types.js";

// Same as createStore: loose api inside, so T infers from the returned
// structure. `stores` is always strongly typed — its types come from the passed
// object literal, independent of T.
export function linkedStore<S extends Record<string, unknown>, T extends object>(
	stores: S,
	factory: InferLinkedFactory<S, T>,
	config?: StoreConfig,
): Store<T> {
	const makeDef: Factory<T> = (api) => (factory as LinkedFactory<S, T>)({ ...api, stores });
	const store = buildStore<T>(makeDef, config);
	// Carry the recipe so adapters / @gehu-js/testing can rebuild a fresh instance
	// (the closure keeps the linked sub-stores bound).
	Object.defineProperty(store, STORE_DEF, {
		value: { factory: makeDef, config: config ?? {} },
		enumerable: false,
	});
	// Emit the named dependency graph (md §15). Plugins inited during buildStore
	// are already subscribed, so devtools captures this.
	const emitter = (store as Record<symbol, unknown>)[EMITTER] as Emitter | undefined;
	emitter?.emit({
		type: "linkedStore.connected",
		payload: { stores: Object.keys(stores) },
	});
	return store;
}
