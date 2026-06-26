# Devtools

`@gehu-js/devtools` is an **event bridge only** — no UI ships in your bundle
(~0.9 KB gzip). It's a plugin; opt-in is the production gate.

```ts
import { devtools, devtoolsBus } from '@gehu-js/devtools';

// explicit plugin
createStore(factory, { name: 'cart', plugins: [devtools()] });

// or shorthand (after importing @gehu-js/devtools once)
createStore(factory, { name: 'cart', devtools: true });

// consume events in-process
devtoolsBus.subscribe((e) => console.log(e));
```

## Events

```txt
store.created / store.destroyed
state.changed          (payload: { prev, next, patch })
action.started / action.completed / action.failed
resource.loading / resource.success / resource.error
mutation.started / mutation.success / mutation.error
linkedStore.connected  (payload: { stores: [...] })
```

Each `DevtoolsEvent` carries `{ type, store, at, target?, payload?, error? }`.

## Bus API

```ts
devtoolsBus.subscribe(fn);     // in-process listener -> CleanupFn
devtoolsBus.exportSnapshots(); // { storeName: snapshot, ... }
devtoolsBus.graph;             // { linkedStoreName: [subStore, ...] }
```

## Browser extension hook

Every event is also forwarded to `globalThis.__GEHU_DEVTOOLS__.send(event)` if
present, so a browser extension can attach without any app wiring. The extension
UI itself is a separate project — only the bridge ships here.

## Production

`devtools()` is off unless you opt in. To force-disable in a build:
`devtools({ enabled: false })`.

## Resource events under Angular

Resource/mutation events are emitted from core regardless of the signal adapter,
so they flow under the Angular adapter too.
