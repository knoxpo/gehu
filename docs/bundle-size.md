# Bundle size

Targets (minified + gzip) and where the packages currently land:

| Package | Target | Current* |
|---|---|---|
| `@gehu/core` | 4–8 KB | ~2–3 KB |
| `@gehu/angular` | 2–5 KB | ~2.4 KB |
| `@gehu/persist` | 1.5–3 KB | ~1.2 KB |
| `@gehu/devtools` | 2–5 KB (bridge only) | ~0.9 KB |
| `@gehu/testing` | 2–4 KB | ~1.6 KB |

\* gzipped size of the unbundled ESM output (`cat dist/*.js | gzip | wc -c`).
Real app numbers are lower after tree-shaking.

Typical Angular app (core + angular): **~5–6 KB gzip**.

## How Gehu stays small

- **Zero runtime dependencies.** No Immer, RxJS, Zustand, lodash, TanStack.
- **`sideEffects: false`** on every package (except the two that register a
  config shorthand — `@gehu/persist` and `@gehu/devtools` mark only their
  `dist/index.js`).
- **ESM-first**, unbundled output → bundlers tree-shake unused exports.
- **No devtools UI** in the runtime — only the event bridge.
- Optional features are separate packages; importing none of them ships none of
  their code.

## Keeping your app small

- Import only what you use: `@gehu/core` alone is enough for a working store.
- The `persist:` / `devtools:` config shorthands require importing their package
  once. If you never import them, the shorthand code is tree-shaken away.
- Prefer explicit `plugins: [...]` for custom plugins — no global registration,
  fully tree-shakable.
