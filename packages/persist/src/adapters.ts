// Browser storage adapters (md §14). All browser-gated: when the global is
// absent (SSR/Node/Bun), fall back to memory — never throws, never touches
// storage on the server.
import { type StorageAdapter, memoryStorage } from '@gehu/core';

declare const localStorage: StorageAdapter | undefined;
declare const sessionStorage: StorageAdapter | undefined;

function fromGlobal(get: () => StorageAdapter | undefined): StorageAdapter {
  let store: StorageAdapter | undefined;
  try {
    store = get();
  } catch {
    store = undefined; // access can throw (e.g. disabled cookies)
  }
  if (!store) return memoryStorage(); // SSR / unavailable
  return {
    getItem: (k) => store.getItem(k),
    setItem: (k, v) => store.setItem(k, v),
    removeItem: (k) => store.removeItem(k),
  };
}

export function localStorageAdapter(): StorageAdapter {
  return fromGlobal(() => (typeof localStorage === 'undefined' ? undefined : localStorage));
}

export function sessionStorageAdapter(): StorageAdapter {
  return fromGlobal(() => (typeof sessionStorage === 'undefined' ? undefined : sessionStorage));
}

export { memoryStorage };

export type StorageChoice = 'local' | 'session' | 'memory' | StorageAdapter;

export function resolveStorage(choice: StorageChoice | undefined): StorageAdapter {
  if (choice === 'local') return localStorageAdapter();
  if (choice === 'session') return sessionStorageAdapter();
  if (choice === 'memory' || choice == null) return memoryStorage();
  return choice; // already a StorageAdapter
}
