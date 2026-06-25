import { DestroyRef, inject } from '@angular/core';
import type { Store } from '@gehu/core';
import { bridgeStore } from './bridge.js';
import { GEHU_REGISTRY } from './registry.js';
import { tokenFor } from './tokens.js';

export type InjectStoreOptions = {
  // 'isolated' (default): per-injector instance, native Angular signals, SSR-safe.
  // 'singleton': bridge the module-level core singleton (shared global state).
  scope?: 'isolated' | 'singleton';
};

export function injectStore<T>(store: Store<T>, opts: InjectStoreOptions = {}): Store<T> {
  if (opts.scope === 'singleton') {
    return bridgeStore(store, inject(DestroyRef));
  }
  // component/feature-scoped instance from provideStore, if present
  const scoped = inject(tokenFor(store), { optional: true }) as Store<T> | null;
  if (scoped) return scoped;
  // app/request-scoped instance from the registry
  const registry = inject(GEHU_REGISTRY, { optional: true });
  if (registry) return registry.getOrCreate(store);
  // no provideGehu in scope (e.g. a bare test) — bridge the singleton
  return bridgeStore(store, inject(DestroyRef));
}
