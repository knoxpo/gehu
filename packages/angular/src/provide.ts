import {
  type EnvironmentProviders,
  Injector,
  type Provider,
  inject,
  makeEnvironmentProviders,
  runInInjectionContext,
} from '@angular/core';
import { buildStore, getStoreDef } from '@gehu/core';
import type { StateOf, Store } from '@gehu/core';
import { angularSignalAdapter } from './adapter.js';
import { GEHU_REGISTRY, GehuRegistry } from './registry.js';
import { GEHU_CONFIG, GEHU_HYDRATION, type GehuConfig, tokenFor } from './tokens.js';

/** Root setup (md §12). Renamed from md's stale `provideVeducx`. */
export function provideGehu(config: GehuConfig = {}): EnvironmentProviders {
  return makeEnvironmentProviders([
    { provide: GEHU_CONFIG, useValue: config },
    {
      provide: GEHU_REGISTRY,
      useFactory: () =>
        new GehuRegistry(inject(Injector), inject(GEHU_HYDRATION, { optional: true }) ?? null),
    },
  ]);
}

/** Component/feature-scoped fresh instance (md §12). */
export function provideStore<T>(store: Store<T>, opts: { hydrate?: unknown } = {}): Provider {
  return {
    provide: tokenFor(store),
    useFactory: () => {
      const def = getStoreDef(store);
      if (!def) return store;
      const injector = inject(Injector);
      const hydrate = opts.hydrate ?? def.config.hydrate;
      return runInInjectionContext(injector, () =>
        buildStore<T>(def.factory, { ...def.config, adapter: angularSignalAdapter, hydrate }),
      );
    },
  };
}

// --- testing (md §16) ---
export function provideGehuTesting(): EnvironmentProviders {
  return provideGehu({});
}

/** Provide a scoped instance seeded with mock state merged over the defaults. */
export function provideMockStore<T>(store: Store<T>, initialState: Partial<StateOf<T>>): Provider {
  return provideStore(store, { hydrate: { ...store.snapshot(), ...initialState } });
}
