# Gehu DevTools (Chrome extension)

A Chrome DevTools panel for inspecting Gehu stores. It consumes the event bridge
already shipped in `@gehu-js/devtools` — **no runtime code change required**.

## What it shows (md §15)

- **Store registry** with live/destroyed badges
- **Action/event timeline** — color-coded, filterable by event group and by store, pause/clear
- **Snapshot** of the selected store's current state
- **Patch diff** for any `state.changed` event (prev → next per key)
- **Resources / Mutations** status table (idle/loading/success/error + last error)
- **Linked-store graph**
- **Perf hints** (excess state changes per action, rapid refetch loops, error count)
- **Export** registry + snapshots + timeline to JSON

## Install (load unpacked)

1. `chrome://extensions` → enable **Developer mode**
2. **Load unpacked** → select this folder (`tooling/devtools-extension`)
3. Open any page running a Gehu app → DevTools (F12) → **Gehu** panel

## Wire it in your app

The panel only sees stores that emit devtools events. Enable per store:

```ts
import { createStore } from "@gehu-js/core";
import "@gehu-js/devtools"; // registers the `devtools: true` shorthand (side-effect import)

export const counter = createStore(
  ({ set, get, ctx }) => ({ count: 0, inc: () => set(s => ({ count: s.count + 1 })) }),
  { name: "counter", devtools: true },
);
```

Or attach the plugin explicitly via `devtools()` from `@gehu-js/devtools`.

> Production gate: the bridge no-ops unless devtools is enabled, and the extension
> UI is never bundled into your app. Without `devtools: true`, the panel shows
> "No Gehu stores detected".

## How it works

```
store event → bus.emit → window.__GEHU_DEVTOOLS__.send   (inject.js, page MAIN world)
  → window.postMessage → content.js → background (relays by tabId) → panel.js
```

`inject.js` sets the `window.__GEHU_DEVTOOLS__` hook the bus calls
(`packages/devtools/src/bus.ts`) and keeps a 500-event replay buffer so a
late-opened panel still sees recent history.

## Snapshot-on-cold-open (upgrade path)

The panel reconstructs state from the live `state.changed` stream. If you open the
panel after the app booted and a store hasn't changed since, its snapshot reads
"no state observed yet". For a true full snapshot on connect, expose the bus read
path on the global hook (Option B):

```ts
// packages/devtools/src/bus.ts — add inside emit()/setup where the hook is created
(globalThis as any).__GEHU_DEVTOOLS__.snapshot = () => devtoolsBus.exportSnapshots();
```

`exportSnapshots()` already exists. Not needed for normal debugging.

## Notes

- Vanilla MV3 — no build step, no dependencies.
- Firefox/Edge: MV3 is largely portable; not packaged here yet.
- No time-travel/rewind (would require a write path into the runtime).
