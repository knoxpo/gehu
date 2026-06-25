# Core concepts

## The two arguments

```ts
createStore(
  ({ set, get, ctx }) => ({ /* the store */ }),  // 1. definition
  { name, devtools, persist, plugins, hydrate }, // 2. config (optional)
);
```

## `set` — update state

```ts
set({ count: 0 });                    // object: shallow-merged
set((s) => ({ count: s.count + 1 })); // updater: receives current state
```

`set` shallow-merges into state. Keys you don't touch are preserved.

## `get` — read state

```ts
get().count;          // current value
get().items.length;
```

`get()` returns the current state (plus the store's own methods, so
`get().someComputed()` works inside actions).

## `ctx` — store utilities

```ts
type StoreContext<T> = {
  reset(): void;                 // restore initial (or hydrated) state
  snapshot(): StateOf<T>;        // deep clone of state (no functions)
  effect(name, fn): CleanupFn;   // reactive effect
  resource(options): StoreResource; // async read — see resources.md
  mutation(options): StoreMutation; // async write — see mutations.md
};
```

## State vs behavior

The factory returns one flat object. Gehu splits it:

| In the factory | On the store |
|---|---|
| plain value (`count: 0`) | signal accessor (`store.count()`) |
| function (`inc: () => …`) | action, as-is (`store.inc()`) |
| `ctx.resource(...)` | resource, as-is (`store.user.data()`) |
| `ctx.mutation(...)` | mutation, as-is (`store.save(input)`) |

`snapshot()` and `getState()` return **state only** — resources, mutations and
actions are excluded.

## Config

```ts
type StoreConfig = {
  name?: string;        // label (devtools, persist key default)
  devtools?: boolean;   // see devtools.md
  persist?: boolean | PersistConfig;  // see persistence.md
  plugins?: StorePlugin[];            // see plugins.md
  hydrate?: unknown;    // seed initial state (SSR) — see ssr.md
};
```

## Signals

Core ships a tiny internal signal system (`signal` / `computed` / `effect`) with
dependency tracking and microtask-batched effects. The Angular adapter swaps in
Angular signals so templates react natively — see [angular.md](angular.md).
