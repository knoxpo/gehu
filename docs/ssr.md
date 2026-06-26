# SSR

Gehu is SSR-safe by design: core never touches browser-only APIs, and Angular
store instances are **per-request**, so state never leaks across requests.

## Per-request isolation

`provideGehu` registers the store registry in the root injector. In Angular SSR
the root injector is created per request, so each request gets its own store
instances automatically. You don't share a module-level singleton on the server.

> Avoid `injectStore(store, { scope: 'singleton' })` on the server — that shares
> the module-level instance across requests.

## Snapshot → transfer → hydrate

Core supports snapshot/hydrate directly:

```ts
// server
const snapshot = store.snapshot();

// client
const store = createStore(factory, { hydrate: snapshot });
```

In Angular, use the helpers + `TransferState`:

```ts
// server: collect snapshots (key by each store's config.name)
import { dehydrate } from '@gehu-js/angular';
const data = dehydrate({ counter: counterStore, cart: cartStore });
transferState.set(GEHU_STATE_KEY, data);

// client: feed them to GEHU_HYDRATION
import { GEHU_HYDRATION } from '@gehu-js/angular';
providers: [
  provideGehu(),
  { provide: GEHU_HYDRATION, useValue: transferState.get(GEHU_STATE_KEY, {}) },
];
```

The registry seeds each store's initial state from `GEHU_HYDRATION` (matched by
`config.name`) when it builds the per-request instance.

### Precedence

If both a hydrated value and persisted state exist, `@gehu-js/persist` decides via
`hydratePrecedence` (default `'hydrate'`) — see [persistence.md](persistence.md).

## React / Next.js (future)

Core supports it; an adapter can be added later. Server Components should use
read/snapshot only; Client Components handle actions/mutations.

See [`examples/angular-ssr`](../examples/angular-ssr).
