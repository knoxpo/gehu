# Gehu · Next.js (App Router, SSR + hydration)

Server-side rendering with per-request store isolation via `<GehuProvider>`.

```sh
npm install
npm run dev     # next dev → http://localhost:3000
npm run build   # next build
```

Shows:

- A [Server Component](app/page.tsx) computes initial state (`count: 42`) and
  passes it to a client [`<GehuProvider hydrate>`](app/providers.tsx).
- [Client components](app/counter.tsx) use the hooks; the provider's per-request
  registry rebuilds the store seeded with the hydrated state — first paint shows
  `42`, no flash.
- For real stores, snapshot them on the server with `dehydrate` from
  `@gehu-js/react/server` and pass the result as `hydrate`.

View source of the page: the server-rendered HTML already contains `42`.
