// createStore + shared buildStore (md §3–6). Destructured-context API only
// ({ set, get, ctx }), never positional (md §21).
import { EMITTER, isBranded, isMutation, STORE_DEF, STORE_SET } from "./brand.js";
import { clone } from "./clone.js";
import { createEmitter } from "./emitter.js";
import { createMutation } from "./mutation.js";
import { getDevtoolsFactory, getPersistFactory } from "./pluginRegistry.js";
import { createResource } from "./resource.js";
import { defaultAdapter } from "./signals.js";
import type {
	Factory,
	InferFactory,
	PluginApi,
	Setter,
	Store,
	StoreApi,
	StoreConfig,
	StoreContext,
	StorePlugin,
	WritableSignalLike,
} from "./types.js";

type Dict = Record<string, unknown>;

function getAtPath(state: unknown, path: string): unknown {
	if (!path) return state;
	let current = state;
	for (const segment of path.split(".")) {
		if (typeof current !== "object" || current === null) return undefined;
		current = (current as Dict)[segment];
	}
	return current;
}

/**
 * Core store engine, shared by createStore and linkedStore. `makeDef` receives
 * the base api and returns the store definition (state values + action fns).
 */
export function buildStore<T extends object>(
	makeDef: (api: StoreApi<T>) => T,
	config: StoreConfig = {},
): Store<T> {
	const adapter = config.adapter ?? defaultAdapter;
	const emitter = createEmitter();
	const bootstrapState = adapter.signal<Dict>({});
	const keySignals = new Map<string, WritableSignalLike<unknown>>();
	let stateKeys: string[] = [];
	// members = actions + resources + mutations: exposed as-is, never state.
	const members: Dict = {};

	const readState = (): Dict => {
		if (stateKeys.length === 0) return bootstrapState();
		const snapshot: Dict = {};
		for (const key of stateKeys) snapshot[key] = keySignals.get(key)?.();
		return snapshot;
	};

	const get = () => ({ ...readState(), ...members }) as T;

	const set: Setter<T> = (partial) => {
		const prev = readState();
		const next = typeof partial === "function" ? partial(get()) : partial;
		const patch: Dict = {};
		for (const key of Object.keys(next as Dict)) {
			const value = (next as Dict)[key];
			if (!Object.is(value, prev[key])) patch[key] = value;
		}
		if (Object.keys(patch).length === 0) return;
		for (const key of Object.keys(patch)) keySignals.get(key)?.set(patch[key]);
		if (emitter.size()) {
			emitter.emit({
				type: "state.changed",
				payload: { prev, next: readState(), patch },
			});
		}
	};

	let initialState: Dict = {};

	const ctx: StoreContext<T> = {
		reset: () => {
			for (const key of stateKeys) keySignals.get(key)?.set(clone(initialState[key]));
		},
		snapshot: () => clone(readState()) as never,
		effect: (_name, fn) => adapter.effect(fn),
		// Casts: generic method signatures don't unify with a plain arrow; the
		// factories carry the real generics.
		resource: ((options: never) =>
			createResource(adapter, options, emitter.emit)) as StoreContext<T>["resource"],
		mutation: ((options: never) =>
			createMutation(adapter, options, emitter.emit)) as StoreContext<T>["mutation"],
	};

	// Run the factory once. Actions reference get/set/ctx lazily via closures.
	const def = makeDef({ set, get, ctx }) as Dict;

	const stateData: Dict = {};
	for (const [key, value] of Object.entries(def)) {
		// functions (actions/mutations) + branded resources are exposed as-is;
		// everything else is plain state.
		if (typeof value === "function" || isBranded(value)) members[key] = value;
		else stateData[key] = value;
	}

	// hydrate (md §5, §13) seeds initial state, replacing the factory defaults.
	initialState = clone((config.hydrate !== undefined ? config.hydrate : stateData) as Dict);
	stateKeys = Object.keys(initialState);
	for (const key of stateKeys) {
		keySignals.set(key, adapter.signal(clone(initialState[key])));
	}
	bootstrapState.set(clone(initialState));

	const stateProxy = new Proxy({} as Dict, {
		get: (_target, prop) => {
			if (typeof prop !== "string") return undefined;
			return keySignals.get(prop)?.();
		},
		ownKeys: () => stateKeys,
		getOwnPropertyDescriptor: (_target, prop) =>
			typeof prop === "string" && stateKeys.includes(prop)
				? {
						configurable: true,
						enumerable: true,
						value: keySignals.get(prop)?.(),
					}
				: undefined,
	}) as Dict;

	const pickCache = new Map<string, () => unknown>();
	const pickSignal = (path: string): (() => unknown) => {
		const cached = pickCache.get(path);
		if (cached) return cached;
		const [topLevel] = path.split(".");
		if (topLevel && !path.includes(".") && keySignals.has(topLevel)) {
			const signal = keySignals.get(topLevel) as (() => unknown) | undefined;
			if (!signal) return () => undefined;
			pickCache.set(path, signal);
			return signal;
		}
		const signal = adapter.computed(() =>
			getAtPath(keySignals.get(topLevel ?? "")?.(), path.slice((topLevel?.length ?? 0) + 1)),
		);
		pickCache.set(path, signal);
		return signal;
	};

	const store: Dict = {};
	for (const key of Object.keys(initialState)) {
		store[key] = keySignals.get(key);
	}
	for (const key of Object.keys(members)) {
		const value = members[key];
		// Wrap plain actions to emit action.* events. Mutations emit their own
		// events; resources are objects (left as-is). emit is a no-op without listeners.
		if (typeof value === "function" && !isMutation(value)) {
			const action = value as (...args: unknown[]) => unknown;
			store[key] = (...args: unknown[]) => {
				emitter.emit({ type: "action.started", target: key, payload: args });
				try {
					const result = action(...args);
					if (result instanceof Promise) {
						return result.then(
							(v) => {
								emitter.emit({ type: "action.completed", target: key });
								return v;
							},
							(e) => {
								emitter.emit({ type: "action.failed", target: key, error: e });
								throw e;
							},
						);
					}
					emitter.emit({ type: "action.completed", target: key });
					return result;
				} catch (e) {
					emitter.emit({ type: "action.failed", target: key, error: e });
					throw e;
				}
			};
		} else {
			store[key] = value;
		}
	}

	Object.defineProperty(store, EMITTER, { value: emitter, enumerable: false });
	Object.defineProperty(store, STORE_SET, { value: set, enumerable: false });

	store.snapshot = ctx.snapshot;
	store.getState = () => clone(readState());
	if (!("select" in store)) {
		store.select = <R>(
			selector: (state: unknown) => R,
			options?: { equal?: (a: R, b: R) => boolean },
		) => {
			void options;
			return adapter.computed(() => (selector as (state: Dict) => R)(stateProxy));
		};
	}
	if (!("pick" in store)) {
		store.pick = (path: string) => pickSignal(path);
	}
	store.subscribe = (
		selectorOrListener: ((state: unknown) => void) | ((state: unknown) => unknown),
		listenerOrOptions?:
			| ((value: unknown, prev: unknown) => void)
			| {
					fireImmediately?: boolean;
					equal?: (a: unknown, b: unknown) => boolean;
			  },
		maybeOptions?: {
			fireImmediately?: boolean;
			equal?: (a: unknown, b: unknown) => boolean;
		},
	) => {
		if (typeof listenerOrOptions !== "function") {
			const listener = selectorOrListener as (state: unknown) => void;
			const options = listenerOrOptions as { fireImmediately?: boolean } | undefined;
			let first = true;
			return adapter.effect(() => {
				const snap = readState();
				if (first) {
					first = false;
					if (options?.fireImmediately) listener(clone(snap));
					return;
				}
				listener(clone(snap));
			});
		}

		const selector = selectorOrListener as (state: unknown) => unknown;
		const listener = listenerOrOptions as (value: unknown, prev: unknown) => void;
		const options = maybeOptions;
		const equal = options?.equal ?? Object.is;
		let current = selector(stateProxy);
		let first = true;
		return adapter.effect(() => {
			const next = selector(stateProxy);
			if (first) {
				first = false;
				if (options?.fireImmediately) listener(next, next);
				current = next;
				return;
			}
			if (equal(next, current)) return;
			const prev = current;
			current = next;
			listener(next, prev);
		});
	};

	// --- plugins (Phase 4/6): run after the store is built ---
	const plugins = [...(config.plugins ?? [])] as unknown as StorePlugin<T>[];
	// `persist: {...}` shorthand → a plugin, if @gehu-js/persist registered a factory.
	if (config.persist) {
		const factory = getPersistFactory();
		if (factory) {
			const persistConfig = typeof config.persist === "object" ? config.persist : {};
			plugins.push(factory(persistConfig, config) as unknown as StorePlugin<T>);
		}
	}
	// `devtools: true` shorthand → a plugin, if @gehu-js/devtools registered a factory.
	if (config.devtools) {
		const factory = getDevtoolsFactory();
		if (factory) plugins.push(factory(config) as unknown as StorePlugin<T>);
	}
	if (plugins.length) {
		const api: PluginApi<T> = {
			config,
			store: store as Store<T>,
			getState: () => clone(readState()) as never,
			setState: (partial) => set(partial as never),
			subscribe: store.subscribe as PluginApi<T>["subscribe"],
			snapshot: ctx.snapshot,
			onEvent: emitter.subscribe,
		};
		for (const plugin of plugins) plugin.init(api);
	}

	return store as Store<T>;
}

/**
 * The factory api is loosely typed (set/get/ctx). This breaks the
 * self-referential cycle (the store's own methods call set/get, whose types
 * depend on the store) so T is inferred straight from the returned structure —
 * no annotation needed. Passing `createStore<T>(...)` still works and checks the
 * returned shape against T; only the set/get *arguments* inside stay loose.
 */
export function createStore<T extends object>(
	factory: InferFactory<T>,
	config?: StoreConfig,
): Store<T> {
	const store = buildStore(factory as Factory<T>, config);
	// Attach the recipe so adapters can rebuild fresh, isolated instances.
	Object.defineProperty(store, STORE_DEF, {
		value: { factory: factory as Factory<T>, config: config ?? {} },
		enumerable: false,
	});
	return store;
}

export type StoreDef<T extends object> = {
	factory: Factory<T>;
	config: StoreConfig;
};

/** Read the re-instantiation recipe a `createStore` result carries, if any. */
export function getStoreDef<T extends object>(store: Store<T>): StoreDef<T> | undefined {
	return (store as Record<symbol, unknown>)[STORE_DEF] as StoreDef<T> | undefined;
}
