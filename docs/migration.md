# Migration: from an Angular service-with-signals store

A common Angular pattern is a service holding signals. Gehu keeps the ergonomics
but adds resources, mutations, linked stores, SSR isolation, persistence, and
devtools — without RxJS.

## Before — a signal service

```ts
@Injectable({ providedIn: 'root' })
export class CounterService {
  private _count = signal(0);
  count = this._count.asReadonly();
  double = computed(() => this._count() * 2);
  inc() { this._count.update((c) => c + 1); }
  reset() { this._count.set(0); }
}

@Component({ template: `{{ svc.count() }}` })
export class CounterComponent {
  svc = inject(CounterService);
}
```

## After — a Gehu store

```ts
// counter.store.ts (framework-free, testable without Angular)
export const counterStore = createStore(
  ({ set, get, ctx }) => ({
    count: 0,
    double: () => get().count * 2,
    inc: () => set((s) => ({ count: s.count + 1 })),
    reset: () => ctx.reset(),
  }),
  { name: 'counter' },
);

// component
@Component({ template: `{{ counter.count() }}` })
export class CounterComponent {
  counter = injectStore(counterStore);
}
```

## What you gain

| Need | Service-with-signals | Gehu |
|---|---|---|
| Computed | `computed()` | a method `() => get()...` |
| Reset to initial | manual `set(initial)` | `ctx.reset()` |
| Async read with loading/error | hand-rolled signals | `ctx.resource(...)` |
| Async write with status/optimistic | hand-rolled | `ctx.mutation(...)` |
| Coordinate services | inject several | `linkedStore(...)` |
| Per-request SSR isolation | manual care | automatic via `provideGehu` |
| Persistence | hand-rolled + SSR guards | `persist: { ... }` |
| Devtools timeline | none | `devtools: true` |
| Test without TestBed | hard | `createTestStore(...)` |

## Migration tips

- Move state + logic into the `createStore` factory; the file no longer imports
  Angular, so it's unit-testable with `@gehu-js/testing`.
- Swap `inject(MyService)` for `injectStore(myStore)` in components. Template
  call sites (`x.count()`) are unchanged — both are signals.
- Need a fresh instance per component? `providers: [provideStore(myStore)]`.
- Replace manual `localStorage` syncing with `persist: { ... }` (it's SSR-safe).

## Migration: from NgRx Signal Store

Gehu also ships a compatibility DSL for teams already using `@ngrx/signals`.
The v1 target is a one-line import-path change to `@gehu-js/angular/ngrx-compat`,
not a full reimplementation of every NgRx helper.

```ts
import { inject } from '@angular/core';
import {
  patchState,
  signalStore,
  withComputed,
  withMethods,
  withState,
} from '@gehu-js/angular/ngrx-compat';

export const CounterStore = signalStore(
  { name: 'counter' },
  withState({ count: 0 }),
  withComputed(({ count }) => ({ doubleCount: () => count() * 2 })),
  withMethods((store) => ({
    increment(): void {
      patchState(store, ({ count }) => ({ count: count + 1 }));
    },
  })),
);

@Component({
  providers: [CounterStore],
  template: `{{ store.count() }} / {{ store.doubleCount() }}`,
})
export class CounterComponent {
  readonly store = inject(CounterStore);
}
```

Supported in v1:

- `signalStore`
- `withState`
- `withComputed`
- `withMethods`
- `withProps`
- `withHooks`
- `patchState`

Not included in v1:

- `rxMethod`
- entity helpers
- advanced `signalStoreFeature` composition

The same compat store can also flow through Gehu DI:

```ts
providers: [provideGehu(), provideStore(CounterStore)];
const store = injectStore(CounterStore);
```
