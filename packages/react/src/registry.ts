// Pure store registry (no React). Shared by the client context and the
// server-safe entry, so server code can use it without a "use client" boundary.
import { buildStore, getStoreDef, type Store } from "@gehu-js/core";

/** Per-request instance cache. Rebuilds stores from their STORE_DEF recipe. */
export class GehuRegistry {
	private instances = new WeakMap<object, unknown>();

	constructor(private hydration: Record<string, unknown> | null = null) {}

	getOrCreate<T extends object>(store: Store<T>): Store<T> {
		const cached = this.instances.get(store as object);
		if (cached) return cached as Store<T>;
		const def = getStoreDef(store);
		if (!def) return store; // not re-instantiable (e.g. linkedStore) — use as-is
		const name = def.config.name;
		const hydrate =
			name && this.hydration && name in this.hydration ? this.hydration[name] : def.config.hydrate;
		const instance = buildStore<T>(def.factory, { ...def.config, hydrate });
		this.instances.set(store as object, instance);
		return instance as Store<T>;
	}
}
