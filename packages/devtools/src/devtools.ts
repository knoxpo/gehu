// The devtools plugin (md §15). Opt-in is the production gate.
import type { StorePlugin } from "@gehu-js/core";
import { type DevtoolsBus, devtoolsBus } from "./bus.js";

export type DevtoolsOptions = {
	enabled?: boolean; // default true; false ⇒ no-op (gate for production)
	bus?: DevtoolsBus;
	name?: string;
};

export function devtools(options: DevtoolsOptions = {}): StorePlugin {
	const bus = options.bus ?? devtoolsBus;
	const enabled = options.enabled ?? true;

	return {
		name: "devtools",
		init(api) {
			if (!enabled) return;
			const name = options.name ?? api.config.name ?? "store";
			bus.register(name, api.store);
			bus.emit({ type: "store.created", store: name, at: Date.now() });

			const unsubscribe = api.onEvent((event) => {
				if (event.type === "linkedStore.connected") {
					bus.graph[name] = (event.payload as { stores: string[] }).stores;
				}
				bus.emit({
					type: event.type,
					store: name,
					at: Date.now(),
					target: event.target,
					payload: event.payload,
					error: event.error,
				});
			});

			return () => {
				bus.emit({ type: "store.destroyed", store: name, at: Date.now() });
				bus.unregister(name);
				unsubscribe();
			};
		},
	};
}
