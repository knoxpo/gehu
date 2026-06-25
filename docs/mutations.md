# Mutations

Mutations are for **async writes**. `ctx.mutation(...)` returns a callable with
`loading` / `error` / `status` signals and `reset()`.

```ts
const profileStore = createStore(({ set, get, ctx }) => ({
  profile: null as Profile | null,

  saveProfile: ctx.mutation({
    name: 'saveProfile',
    run: (input: Profile) => api.saveProfile(input),
    onSuccess: (profile) => set({ profile }),
    onError: (err) => console.error(err),
    onSettled: () => {},
  }),
}));
```

## Calling

```ts
const out = await profileStore.saveProfile({ name: 'Alex' });
profileStore.saveProfile.status();  // 'idle' | 'loading' | 'success' | 'error'
profileStore.saveProfile.reset();
```

## `errorSwallow` (default `true`)

- **`true`** (default) — on failure: set `error`/`status`, call `onError`, then
  **resolve `undefined`** (never throws). Inspect `error()`/`status()`.
- **`false`** — same, then **rethrow** so `await` rejects.

```ts
ctx.mutation({ run, errorSwallow: false }); // await throws on failure
```

## Optimistic updates

`optimistic(input)` runs before `run` and returns a rollback function called on
failure:

```ts
ctx.mutation({
  run: (item) => api.add(item),
  optimistic: (item) => {
    const prev = get().items;
    set({ items: [...prev, item] });
    return () => set({ items: prev }); // rolled back if run rejects
  },
});
```

## Options

```ts
ctx.mutation({
  name?: string;
  run: (input: I) => Promise<O>;
  onSuccess?: (output: O) => void;
  onError?: (error: unknown) => void;
  onSettled?: () => void;
  optimistic?: (input: I) => (() => void) | void;
  errorSwallow?: boolean;   // default true
  retry?: number;
});
```

Mock with `mockMutation({ output })` — see [testing.md](testing.md).
