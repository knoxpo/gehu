import {
	type EnvironmentProviders,
	Injector,
	inject,
	makeEnvironmentProviders,
	type Provider,
} from "@angular/core";
import type { StateOf, Store } from "@gehu/core";
import { buildStore, getStoreDef } from "@gehu/core";
import { angularSignalAdapter } from "./adapter.js";
import {
	type CompatStoreToken,
	createCompatStore,
	getCompatDef,
	isCompatStoreToken,
} from "./ngrx-compat/internals.js";
import { GEHU_REGISTRY, GehuRegistry } from "./registry.js";
import {
	GEHU_CONFIG,
	GEHU_HYDRATION,
	type GehuConfig,
	tokenFor,
} from "./tokens.js";

/** Root setup (md §12). Renamed from md's stale `provideVeducx`. */
export function provideGehu(config: GehuConfig = {}): EnvironmentProviders {
	return makeEnvironmentProviders([
		{ provide: GEHU_CONFIG, useValue: config },
		{
			provide: GEHU_REGISTRY,
			useFactory: () =>
				new GehuRegistry(
					inject(Injector),
					inject(GEHU_HYDRATION, { optional: true }) ?? null,
				),
		},
	]);
}

/** Component/feature-scoped fresh instance (md §12). */
export function provideStore<T extends object>(
	store: Store<T> | CompatStoreToken<T>,
	opts?: { hydrate?: unknown },
): Provider;
export function provideStore<T extends object>(
	store: Store<T> | CompatStoreToken<T>,
	opts: { hydrate?: unknown } = {},
): Provider {
	return {
		// ngrx-compat stores are injected by their class token (`inject(Store)`),
		// so provide them under the class itself. Plain Gehu stores use tokenFor.
		provide: isCompatStoreToken(store) ? store : tokenFor(store),
		// A useFactory already runs inside an injection context, so build directly
		// (an explicit inject(Injector) + runInInjectionContext here throws NG0203).
		useFactory: () => {
			if (isCompatStoreToken(store)) {
				const def = getCompatDef(store);
				const hydrate = opts.hydrate ?? def.config.hydrate;
				return createCompatStore<T>(def, hydrate);
			}
			const gehuStore = store as Store<T>;
			const def = getStoreDef(gehuStore);
			if (!def) return gehuStore;
			const hydrate = opts.hydrate ?? def.config.hydrate;
			return buildStore<T>(def.factory, {
				...def.config,
				adapter: angularSignalAdapter,
				hydrate,
			});
		},
	};
}

// --- testing (md §16) ---
export function provideGehuTesting(): EnvironmentProviders {
	return provideGehu({});
}

/** Provide a scoped instance seeded with mock state merged over the defaults. */
export function provideMockStore<T>(
	store: Store<T>,
	initialState: Partial<StateOf<T>>,
): Provider {
	return provideStore(store, {
		hydrate: { ...store.snapshot(), ...initialState },
	});
}
