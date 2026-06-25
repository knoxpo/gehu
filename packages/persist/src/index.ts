// @gehu/persist — persistence plugin + storage adapters (md §14).
import { setPersistFactory } from '@gehu/core';
import { persist } from './persist.js';

export { persist } from './persist.js';
export {
  localStorageAdapter,
  sessionStorageAdapter,
  memoryStorage,
  resolveStorage,
} from './adapters.js';
export type { StorageChoice } from './adapters.js';

// Register the `persist: {...}` shorthand. Side-effect on import — tree-shakable:
// no import of @gehu/persist ⇒ none of this code ships.
setPersistFactory((persistConfig, storeConfig) => persist(persistConfig, storeConfig));
