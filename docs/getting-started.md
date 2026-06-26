# Getting started

## Install

```sh
npm install @gehu-js/core
# optional
npm install @gehu-js/angular @gehu-js/persist @gehu-js/devtools @gehu-js/testing
```

Gehu is ESM-first and ships TypeScript declarations. Works in Bun, Node, the
browser, and during SSR.

## Your first store

```ts
import { createStore } from '@gehu-js/core';

export const counterStore = createStore(
  ({ set, get, ctx }) => ({
    count: 0,
    double: () => get().count * 2,        // computed
    inc: () => set((s) => ({ count: s.count + 1 })),  // action
    reset: () => ctx.reset(),
  }),
  { name: 'counter' },
);
```

The factory takes a **single destructured argument** `{ set, get, ctx }` — never
positional `(set, get)`. This keeps the API extensible.

## Read and update (vanilla)

State keys become **signal accessors** (call them to read). Actions and
computeds are exposed as-is.

```ts
counterStore.count();    // 0  — signal accessor
counterStore.double();   // 0  — computed
counterStore.inc();
counterStore.count();    // 1
counterStore.snapshot(); // { count: 1 }  — plain state, no functions
counterStore.reset();
```

Subscribe to changes:

```ts
const stop = counterStore.subscribe((state) => console.log(state));
counterStore.inc(); // logs { count: 1 } (fires on change, not immediately)
stop();
```

> In tests, call `flushSync()` from `@gehu-js/core` to run pending subscriptions
> synchronously.

## Typing

No annotation needed — the store type is inferred from the returned structure,
so `counterStore.count()` is `number` and `counterStore.inc` is callable. If you
prefer an explicit interface, `createStore<Counter>(...)` also works.

Next: [core concepts](core-concepts.md).
