// @gehu-js/persist — persistence plugin + storage adapters (md §14).
import { setPersistFactory } from "@gehu-js/core";
import { persist } from "./persist.js";

export type { StorageChoice } from "./adapters.js";
export {
	localStorageAdapter,
	memoryStorage,
	resolveStorage,
	sessionStorageAdapter,
} from "./adapters.js";
export { persist } from "./persist.js";

// Register the `persist: {...}` shorthand. Side-effect on import — tree-shakable:
// no import of @gehu-js/persist ⇒ none of this code ships.
setPersistFactory((persistConfig, storeConfig) => persist(persistConfig, storeConfig));
