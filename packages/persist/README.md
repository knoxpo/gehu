# @gehu-js/persist

Persistence plugin and storage adapters for Gehu.

`@gehu-js/persist` adds storage-backed persistence to `@gehu-js/core` stores and registers the `persist` config shorthand.

## Install

```sh
npm install @gehu-js/persist @gehu-js/core
```

## Overview

Use this package when part of a store should survive reloads, browser restarts, or route changes.

It supports:

- local storage
- session storage
- in-memory fallback
- custom storage adapters
- migration and versioning
- selective persistence

## Main API

- `persist(config?, storeConfig?)` creates a persistence plugin
- `resolveStorage(choice)` resolves the configured storage adapter
- `localStorageAdapter()` returns a browser localStorage adapter
- `sessionStorageAdapter()` returns a browser sessionStorage adapter
- `memoryStorage()` returns an in-memory adapter

Importing the package also enables this core shorthand:

```ts
createStore(factory, {
  persist: { key: "my-store" },
});
```

## Example

```ts
import { createStore } from "@gehu-js/core";
import "@gehu-js/persist";

const settingsStore = createStore(
  () => ({
    theme: "light",
  }),
  {
    name: "settings",
    persist: { key: "settings" },
  },
);
```

Full docs: https://github.com/knoxpo/gehu#readme
