// @gehu/core — public API (md §3, §9, §11).

export { isMutation, isResource, STORE_DEF, STORE_SET } from "./brand.js";
export type { StoreDef } from "./createStore.js";
export { buildStore, createStore, getStoreDef } from "./createStore.js";
export { linkedStore } from "./linkedStore.js";
export { memoryStorage } from "./memoryStorage.js";
export { setDevtoolsFactory, setPersistFactory } from "./pluginRegistry.js";
export { defaultAdapter, flushSync } from "./signals.js";
export type {
	CleanupFn,
	Emitter,
	Factory,
	LinkedApi,
	LinkedFactory,
	MutationOptions,
	PersistConfig,
	PluginApi,
	ResourceOptions,
	ResourceStatus,
	SignalAdapter,
	SignalLike,
	StateOf,
	StorageAdapter,
	Store,
	StoreApi,
	StoreConfig,
	StoreContext,
	StoreEvent,
	StoreEventType,
	StoreMutation,
	StorePlugin,
	StoreResource,
	WritableSignalLike,
} from "./types.js";
