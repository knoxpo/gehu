# @gehu-js/core

Platform-agnostic core for Gehu.

`@gehu-js/core` provides the store engine, signal runtime, async resources, async mutations, linked stores, and the plugin hooks used by the adapter packages.

## Install

```sh
npm install @gehu-js/core
```

## Overview

Use this package when you want Gehu without framework bindings, or when you are building adapters/plugins on top of the core runtime.

It is designed to stay:

- framework-agnostic
- tree-shakable
- SSR-safe
- dependency-light

## Main API

- `createStore(factory, config?)` creates a store with state, actions, computeds, resources, and mutations
- `buildStore(factory, config?)` builds an instance from a reusable store definition
- `getStoreDef(store)` reads the rebuild metadata attached to a store
- `linkedStore(stores, factory, config?)` coordinates multiple stores through one composed store
- `memoryStorage()` returns an in-memory storage adapter
- `setPersistFactory()` registers the `persist` shorthand used by `@gehu-js/persist`
- `setDevtoolsFactory()` registers the `devtools` shorthand used by `@gehu-js/devtools`
- `shallowEqual()` compares plain objects shallowly
- `defaultAdapter` and `flushSync()` expose the core signal runtime

## Example

```ts
import { createStore } from "@gehu-js/core";

const counterStore = createStore(
  ({ set, get, ctx }) => ({
    count: 0,
    double: () => get().count * 2,
    increment: () => set((state) => ({ count: state.count + 1 })),
    load: ctx.resource({
      fetch: async () => 42,
    }),
  }),
  { name: "counter" },
);
```

## Related packages

- `@gehu-js/angular` for Angular integration
- `@gehu-js/react` for React hooks and SSR helpers
- `@gehu-js/persist` for persistence
- `@gehu-js/devtools` for event-based devtools integration
- `@gehu-js/testing` for store test helpers

Full docs: https://github.com/knoxpo/gehu#readme
