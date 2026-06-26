# Gehu · React (Vite, CSR)

Client-rendered React app on a Gehu store.

```sh
npm install   # or bun install at the workspace root
npm run dev   # vite → http://localhost:5173
npm run build
```

Shows:

- [`createStoreHook`](src/App.tsx) — Zustand-style bound hook
  (`useCounter(s => s.count)`, `useCounter(s => s.inc)`).
- [`useResource`](src/App.tsx) — atomic resource view (`data/loading/status`).
- [`useStoreApi`](src/App.tsx) — call actions on the resolved instance.
- a [framework-free store](src/stores.ts) shared with any framework.
