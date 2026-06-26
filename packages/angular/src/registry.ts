// App/request-scoped instance cache. Provided in root by provideGehu, so on SSR
// it lives in the per-request injector → each request gets isolated instances
// (Phase 3 AC: no global store leakage).
import {
	InjectionToken,
	type Injector,
	runInInjectionContext,
} from "@angular/core";
import type { Store } from "@gehu/core";
import { buildStore, getStoreDef } from "@gehu/core";
import { angularSignalAdapter } from "./adapter.js";
import {
	type CompatStoreToken,
	createCompatStore,
	getCompatDef,
	isCompatStoreToken,
} from "./ngrx-compat/internals.js";

export class GehuRegistry {
	private instances = new WeakMap<object, unknown>();

	constructor(
		private injector: Injector,
		private hydration: Record<string, unknown> | null,
	) {}

	getOrCreate<T extends object>(
		store: Store<T> | CompatStoreToken<T>,
	): T | Store<T> {
		if (isCompatStoreToken(store)) {
			const cached = this.instances.get(store as object);
			if (cached) return cached as T;
			const def = getCompatDef(store);
			const name = def.config.name;
			const hydrate =
				name && this.hydration && name in this.hydration
					? this.hydration[name]
					: def.config.hydrate;
			const instance = runInInjectionContext(this.injector, () =>
				createCompatStore<T>(def, hydrate),
			);
			this.instances.set(store as object, instance);
			return instance;
		}
		const gehuStore = store as Store<T>;
		const def = getStoreDef(gehuStore);
		if (!def) return gehuStore; // not a createStore result (e.g. linkedStore) — bridge instead
		const cached = this.instances.get(gehuStore as object);
		if (cached) return cached as Store<T>;

		const name = def.config.name;
		const hydrate =
			name && this.hydration && name in this.hydration
				? this.hydration[name]
				: def.config.hydrate;
		const instance = runInInjectionContext(this.injector, () =>
			buildStore<T>(def.factory, {
				...def.config,
				adapter: angularSignalAdapter,
				hydrate,
			}),
		);
		this.instances.set(gehuStore as object, instance);
		return instance;
	}
}

export const GEHU_REGISTRY = new InjectionToken<GehuRegistry>("gehu.registry");
