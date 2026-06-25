# Gehu · Angular basic (CSR)

Standard client-side-rendered Angular app using a Gehu store.

```sh
npm install      # or bun install at the workspace root
npm start        # ng serve → http://localhost:4200
npm run build    # ng build
```

What it shows:

- [`provideGehu`](src/app/app.config.ts) at the root
- [`injectStore(counterStore)`](src/app/app.component.ts) — state accessors are
  Angular signals used directly in the template
- [a framework-free store](src/app/counter.store.ts) with `devtools: true`
