// The persist plugin (md §14). Generic over any StorageAdapter; the browser
// specifics live in adapters.ts, so this stays pure logic.
import type { PersistConfig, StoreConfig, StorePlugin } from "@gehu-js/core";
import { resolveStorage, type StorageChoice } from "./adapters.js";

type Stored = { v: number; s: unknown };

export function persist(config: PersistConfig = {}, storeConfig?: StoreConfig): StorePlugin {
	const key = config.key ?? storeConfig?.name ?? "gehu";
	const version = config.version ?? 0;
	const select = config.select ?? ((s: unknown) => s);
	const serialize = config.serialize ?? JSON.stringify;
	const deserialize = config.deserialize ?? JSON.parse;
	const precedence = config.hydratePrecedence ?? "hydrate";
	const adapter = resolveStorage(config.storage as StorageChoice | undefined);

	return {
		name: "persist",
		init(api) {
			// --- load ---
			const raw = adapter.getItem(key);
			if (raw != null) {
				let stored: Stored | null = null;
				try {
					stored = deserialize(raw) as Stored;
				} catch {
					stored = null; // corrupt payload → ignore
				}
				if (stored) {
					let value = stored.s;
					if (stored.v !== version && config.migrate) {
						value = config.migrate(value, stored.v);
					}
					const hadHydrate = api.config.hydrate !== undefined;
					// factory defaults < persisted < hydrate (default), or persisted wins.
					if (!hadHydrate || precedence === "persisted") {
						api.setState(value as Partial<ReturnType<typeof api.getState>>);
					}
				}
			}

			// --- save on every change ---
			const write = (state: unknown) =>
				adapter.setItem(key, serialize({ v: version, s: select(state) } satisfies Stored));
			return api.subscribe((state) => write(state));
		},
	};
}
