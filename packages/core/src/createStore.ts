// createStore + shared buildStore (md §3–6). Destructured-context API only
// ({ set, get, ctx }), never positional (md §21).
import { EMITTER, STORE_DEF, isBranded, isMutation } from './brand.js';
import { clone } from './clone.js';
import { createEmitter } from './emitter.js';
import { createMutation } from './mutation.js';
import { getDevtoolsFactory, getPersistFactory } from './pluginRegistry.js';
import { createResource } from './resource.js';
import { defaultAdapter } from './signals.js';
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
} from './types.js';

type Dict = Record<string, unknown>;

/**
 * Core store engine, shared by createStore and linkedStore. `makeDef` receives
 * the base api and returns the store definition (state values + action fns).
 */
export function buildStore<T>(
  makeDef: (api: StoreApi<T>) => T,
  config: StoreConfig = {},
): Store<T> {
  const adapter = config.adapter ?? defaultAdapter;
  const emitter = createEmitter();
  const stateSig = adapter.signal<Dict>({});
  // members = actions + resources + mutations: exposed as-is, never state.
  const members: Dict = {};

  const get = () => ({ ...stateSig(), ...members }) as T;

  const set: Setter<T> = (partial) => {
    const prev = stateSig();
    const next = typeof partial === 'function' ? partial(get()) : partial;
    const merged = { ...prev, ...(next as Dict) };
    stateSig.set(merged);
    if (emitter.size()) {
      const patch: Dict = {};
      for (const key of Object.keys(next as Dict)) {
        if (!Object.is((next as Dict)[key], prev[key])) patch[key] = (next as Dict)[key];
      }
      emitter.emit({ type: 'state.changed', payload: { prev, next: merged, patch } });
    }
  };

  let initialState: Dict = {};

  const ctx: StoreContext<T> = {
    reset: () => stateSig.set(clone(initialState)),
    snapshot: () => clone(stateSig()) as never,
    effect: (_name, fn) => adapter.effect(fn),
    // Casts: generic method signatures don't unify with a plain arrow; the
    // factories carry the real generics.
    resource: ((options: never) =>
      createResource(adapter, options, emitter.emit)) as StoreContext<T>['resource'],
    mutation: ((options: never) =>
      createMutation(adapter, options, emitter.emit)) as StoreContext<T>['mutation'],
  };

  // Run the factory once. Actions reference get/set/ctx lazily via closures.
  const def = makeDef({ set, get, ctx }) as Dict;

  const stateData: Dict = {};
  for (const [key, value] of Object.entries(def)) {
    // functions (actions/mutations) + branded resources are exposed as-is;
    // everything else is plain state.
    if (typeof value === 'function' || isBranded(value)) members[key] = value;
    else stateData[key] = value;
  }

  // hydrate (md §5, §13) seeds initial state, replacing the factory defaults.
  initialState = clone((config.hydrate !== undefined ? config.hydrate : stateData) as Dict);
  stateSig.set(clone(initialState));

  // ponytail: per-key accessor reads the whole state signal, so any set()
  // re-notifies every accessor. Coarse but correct; split into per-key signals
  // only if a profile shows it matters.
  const store: Dict = {};
  for (const key of Object.keys(initialState)) {
    store[key] = adapter.computed(() => stateSig()[key]);
  }
  for (const key of Object.keys(members)) {
    const value = members[key];
    // Wrap plain actions to emit action.* events. Mutations emit their own
    // events; resources are objects (left as-is). emit is a no-op without listeners.
    if (typeof value === 'function' && !isMutation(value)) {
      const action = value as (...args: unknown[]) => unknown;
      store[key] = (...args: unknown[]) => {
        emitter.emit({ type: 'action.started', target: key, payload: args });
        try {
          const result = action(...args);
          if (result instanceof Promise) {
            return result.then(
              (v) => (emitter.emit({ type: 'action.completed', target: key }), v),
              (e) => {
                emitter.emit({ type: 'action.failed', target: key, error: e });
                throw e;
              },
            );
          }
          emitter.emit({ type: 'action.completed', target: key });
          return result;
        } catch (e) {
          emitter.emit({ type: 'action.failed', target: key, error: e });
          throw e;
        }
      };
    } else {
      store[key] = value;
    }
  }

  Object.defineProperty(store, EMITTER, { value: emitter, enumerable: false });

  store.snapshot = ctx.snapshot;
  store.getState = () => clone(stateSig());
  store.subscribe = (listener: (state: unknown) => void) => {
    let first = true;
    return adapter.effect(() => {
      const snap = stateSig();
      if (first) {
        first = false; // skip the initial run; fire on changes only (Zustand-like)
        return;
      }
      listener(clone(snap));
    });
  };

  // --- plugins (Phase 4/6): run after the store is built ---
  const plugins: StorePlugin[] = [...(config.plugins ?? [])];
  // `persist: {...}` shorthand → a plugin, if @gehu/persist registered a factory.
  if (config.persist) {
    const factory = getPersistFactory();
    if (factory) {
      const persistConfig = typeof config.persist === 'object' ? config.persist : {};
      plugins.push(factory(persistConfig, config));
    }
  }
  // `devtools: true` shorthand → a plugin, if @gehu/devtools registered a factory.
  if (config.devtools) {
    const factory = getDevtoolsFactory();
    if (factory) plugins.push(factory(config));
  }
  if (plugins.length) {
    const api: PluginApi<T> = {
      config,
      store: store as Store<T>,
      getState: () => clone(stateSig()) as never,
      setState: (partial) => set(partial as never),
      subscribe: store.subscribe as PluginApi<T>['subscribe'],
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

export type StoreDef<T> = { factory: Factory<T>; config: StoreConfig };

/** Read the re-instantiation recipe a `createStore` result carries, if any. */
export function getStoreDef<T>(store: Store<T>): StoreDef<T> | undefined {
  return (store as Record<symbol, unknown>)[STORE_DEF] as StoreDef<T> | undefined;
}
