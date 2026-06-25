# Resources

Resources are for **async reads**. `ctx.resource(...)` returns an object with
`data` / `loading` / `error` / `status` signals plus `refetch()` and `clear()`.

```ts
const usersStore = createStore(({ set, get, ctx }) => ({
  selectedId: null as string | null,

  user: ctx.resource({
    name: 'user',
    autoRun: true,                         // re-fetch when key/enabled change
    enabled: () => !!get().selectedId,
    key: () => ['user', get().selectedId],
    fetch: () => api.getUser(get().selectedId!),
  }),

  selectUser: (id: string) => set({ selectedId: id }),
}));
```

## Reading

```ts
usersStore.user.data();     // T | undefined
usersStore.user.loading();  // boolean
usersStore.user.error();    // unknown | null
usersStore.user.status();   // 'idle' | 'loading' | 'success' | 'error'
```

## `autoRun` (default `false`)

- **`false`** — manual. Nothing fetches until you call `refetch()`. `enabled()`
  still gates a manual run.
- **`true`** — reactive. An effect watches `enabled()` + `key()`; because both
  read state via `get()`, the resource re-fetches automatically when those
  dependencies change. Stale results are discarded when the key changes mid-flight.

## Options

```ts
ctx.resource({
  name?: string;
  key?: () => readonly unknown[];      // dedupe + change detection (autoRun)
  enabled?: () => boolean;             // gate
  fetch: ({ signal }) => Promise<T>;   // signal is an AbortSignal (optional to use)
  autoRun?: boolean;
  retry?: number;                      // retry N times on rejection
});
```

## Abort

Each run gets an `AbortController`; a newer run aborts the previous and the stale
result is dropped. Your `fetch` receives `{ signal }` if you want to cancel the
underlying request — but you don't have to use it; Gehu discards stale results
regardless.

## Mocking in tests

See [testing.md](testing.md) — `mockResource({ data })`.
