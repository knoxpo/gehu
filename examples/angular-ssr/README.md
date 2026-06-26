# Gehu · Angular SSR + hydration

Server-side rendering with per-request store isolation and TransferState
hydration.

```sh
npm install
npm run build        # ng build (browser + server bundles)
npm run serve:ssr    # node dist/server/server.mjs → http://localhost:4000
# or: npm start      # ng serve (dev SSR)
```

What it shows:

- **Per-request isolation** — `provideGehu` registers the store registry in the
  per-request root injector, so requests never share state.
- **Hydration** — the [server config](src/app/app.config.server.ts) computes
  initial state (`count: 42`), hands it to Gehu via `GEHU_HYDRATION`, and stashes
  it in `TransferState`; the [browser config](src/app/app.config.ts) reads
  `TransferState` back into `GEHU_HYDRATION`. The first paint already shows `42`
  — no flash back to the default `0`.
- `injectStore(counterStore)` in the [component](src/app/app.component.ts), with
  signals driving both the server render and the hydrated client.

View source of the served page to see `count = 42` in the server-rendered HTML
(`ng-server-context="ssr"` confirms it was rendered on the server, not the client).

Notes for Angular 20 SSR:

- `main.server.ts` must thread the `BootstrapContext` into `bootstrapApplication`.
- The server enforces an SSRF Host allowlist. This demo allows `localhost` in
  [`server.ts`](src/server.ts); in production set your real host there or via the
  `NG_ALLOWED_HOSTS` env var.
