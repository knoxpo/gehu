import { DestroyRef, inject } from "@angular/core";
import type { Store } from "@gehu-js/core";
import { bridgeStore } from "./bridge.js";
import {
	type CompatStoreToken,
	createCompatStore,
	getCompatDef,
	isCompatStoreToken,
} from "./ngrx-compat/internals.js";
import { GEHU_REGISTRY } from "./registry.js";
import { tokenFor } from "./tokens.js";

export type InjectStoreOptions = {
	// 'isolated' (default): per-injector instance, native Angular signals, SSR-safe.
	// 'singleton': bridge the module-level core singleton (shared global state).
	scope?: "isolated" | "singleton";
};

// A Gehu store returns a Store<T>; an ngrx-compat token returns its instance T.
// Two overloads keep those distinct (a single union would make every accessor
// `value | SignalLike<value>` and break call sites).
export function injectStore<T>(store: Store<T>, opts?: InjectStoreOptions): Store<T>;
export function injectStore<T extends object>(
	store: CompatStoreToken<T>,
	opts?: InjectStoreOptions,
): T;
export function injectStore<T extends object>(
	store: Store<T> | CompatStoreToken<T>,
	opts: InjectStoreOptions = {},
): T | Store<T> {
	if (isCompatStoreToken(store)) {
		// Compat stores are provided under their class token (see provideStore).
		const scoped = inject(store, { optional: true }) as T | null;
		if (scoped) return scoped;
		const registry = inject(GEHU_REGISTRY, { optional: true });
		if (registry) return registry.getOrCreate(store);
		return createCompatStore<T>(getCompatDef(store));
	}
	const gehuStore = store as Store<T>;
	if (opts.scope === "singleton") {
		return bridgeStore(gehuStore, inject(DestroyRef));
	}
	// component/feature-scoped instance from provideStore, if present
	const scoped = inject(tokenFor(gehuStore), {
		optional: true,
	}) as Store<T> | null;
	if (scoped) return scoped;
	// app/request-scoped instance from the registry
	const registry = inject(GEHU_REGISTRY, { optional: true });
	if (registry) return registry.getOrCreate(gehuStore);
	// no provideGehu in scope (e.g. a bare test) — bridge the singleton
	return bridgeStore(gehuStore, inject(DestroyRef));
}
