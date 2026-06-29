# @gehu-js/react

React bindings for Gehu stores.

`@gehu-js/react` adds hooks, provider-based scoping, and hydration helpers on top of `@gehu-js/core`.

## Install

```sh
npm install @gehu-js/react @gehu-js/core react react-dom
```

## Overview

Use this package when you want Gehu stores to behave naturally in React components, including SSR and per-request store isolation.

It provides:

- selector-based store hooks
- resource and mutation hooks
- provider-scoped store registries
- server-safe hydration helpers

## Main API

- `useStore(store, selector, isEqual?)` reads selected store state and re-renders only when needed
- `useSignal(signalLike)` subscribes to a single signal accessor
- `useResource(resource)` reads resource status/data helpers
- `useMutation(mutation)` reads mutation helpers
- `useStoreApi(store)` exposes non-reactive store methods
- `createStoreHook(store)` builds a dedicated hook for one store
- `GehuProvider` scopes store instances for a subtree
- `useInstance(store)` resolves the provider-scoped store instance
- `dehydrate(stores)` serializes store snapshots for SSR
- `GehuRegistry` manages per-request instances
- `shallow` re-exports the core shallow equality helper

## Example

```tsx
import { useStore } from "@gehu-js/react";
import { counterStore } from "./counter.store";

export function Counter() {
  const count = useStore(counterStore, (state) => state.count);
  return <button onClick={() => counterStore.increment()}>{count}</button>;
}
```

## Package exports

- `@gehu-js/react`
- `@gehu-js/react/server`

Full docs: https://github.com/knoxpo/gehu#readme
