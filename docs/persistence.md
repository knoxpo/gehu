# Persistence

`@gehu-js/persist` is a plugin that loads state on init and saves it on change.
Browser-gated and SSR-safe: it never touches storage on the server.

## Two ways to use it

```ts
import { persist } from '@gehu-js/persist';

// 1. explicit plugin (the extensible path)
createStore(factory, {
  name: 'cart',
  plugins: [persist({ key: 'cart', storage: 'local', select: (s) => ({ items: s.items }) })],
});

// 2. md shorthand (works once @gehu-js/persist is imported anywhere)
createStore(factory, {
  name: 'cart',
  persist: { key: 'cart', storage: 'local' },
});
```

## Config

```ts
persist({
  key?: string;                 // storage key (defaults to config.name)
  storage?: 'local' | 'session' | 'memory' | StorageAdapter;  // default memory
  select?: (state) => unknown;  // partial persistence (default: whole state)
  version?: number;
  migrate?: (old, oldVersion) => unknown;  // run when stored version differs
  serialize?/deserialize?;      // default JSON
  hydratePrecedence?: 'hydrate' | 'persisted';  // default 'hydrate'
});
```

## Storage adapters

```ts
import { localStorageAdapter, sessionStorageAdapter, memoryStorage } from '@gehu-js/persist';
```

All browser adapters are **gated**: when the global is missing (SSR/Node/Bun)
they fall back to memory — never throwing, never reading storage on the server.
A custom adapter is any `{ getItem, setItem, removeItem }`.

## Hydrate precedence (SSR)

Order is `factory defaults < persisted < hydrate` by default. Set
`hydratePrecedence: 'persisted'` to make stored state always win over an explicit
`hydrate` (e.g. SSR transfer).

## Versioning / migration

```ts
persist({
  key: 'cart',
  storage: 'local',
  version: 2,
  migrate: (old, fromVersion) => /* upgrade old payload */ old,
});
```

When the stored payload's version differs from `version`, `migrate` runs before
the value is applied.
