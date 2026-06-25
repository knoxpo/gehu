// App/request-scoped instance cache. Provided in root by provideGehu, so on SSR
// it lives in the per-request injector → each request gets isolated instances
// (Phase 3 AC: no global store leakage).
import { InjectionToken, Injector, runInInjectionContext } from '@angular/core';
import { buildStore, getStoreDef } from '@gehu/core';
import type { Store } from '@gehu/core';
import { angularSignalAdapter } from './adapter.js';

export class GehuRegistry {
  private instances = new WeakMap<object, unknown>();

  constructor(
    private injector: Injector,
    private hydration: Record<string, unknown> | null,
  ) {}

  getOrCreate<T>(store: Store<T>): Store<T> {
    const def = getStoreDef(store);
    if (!def) return store; // not a createStore result (e.g. linkedStore) — bridge instead
    const cached = this.instances.get(store as object);
    if (cached) return cached as Store<T>;

    const name = def.config.name;
    const hydrate = name && this.hydration && name in this.hydration ? this.hydration[name] : def.config.hydrate;
    const instance = runInInjectionContext(this.injector, () =>
      buildStore<T>(def.factory, { ...def.config, adapter: angularSignalAdapter, hydrate }),
    );
    this.instances.set(store as object, instance);
    return instance;
  }
}

export const GEHU_REGISTRY = new InjectionToken<GehuRegistry>('gehu.registry');
