# Plugins

Persistence and devtools are both built on the same plugin system. You can write
your own — a logger, an analytics bridge, cross-tab sync, time-travel, etc.

## The contract

```ts
import type { StorePlugin } from '@gehu-js/core';

type StorePlugin<T = unknown> = {
  name: string;
  init(api: PluginApi<T>): void | CleanupFn; // return a cleanup fn if needed
};

type PluginApi<T> = {
  config: StoreConfig;
  store: Store<T>;                              // the built store (actions, resources, …)
  getState(): StateOf<T>;
  setState(partial: Partial<StateOf<T>>): void; // apply state (e.g. loaded/persisted)
  subscribe(listener): CleanupFn;               // state changes
  snapshot(): StateOf<T>;
  onEvent(fn): CleanupFn;                        // lifecycle events (see devtools.md)
};
```

`init` runs once, after the store is built.

## Example: a logger plugin

```ts
import type { StorePlugin } from '@gehu-js/core';

export const logger = (): StorePlugin => ({
  name: 'logger',
  init: (api) =>
    api.onEvent((e) => {
      console.log(`[${api.config.name}] ${e.type}`, e.target ?? '', e.payload ?? '');
    }),
});

createStore(factory, { name: 'cart', plugins: [logger()] });
```

## Events available via `onEvent`

`state.changed`, `action.started/completed/failed`,
`resource.loading/success/error`, `mutation.started/success/error`,
`linkedStore.connected`. See [devtools.md](devtools.md) for payload shapes.

## Registering a config shorthand (optional)

Like `persist:` and `devtools:`, you can expose a config shorthand from your
package. The mechanism (`setPersistFactory` / `setDevtoolsFactory`) is internal
to those packages; for your own plugin, prefer the explicit `plugins: [yours()]`
array — it's tree-shakable and needs no global registration.
