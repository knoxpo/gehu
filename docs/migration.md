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
  Angular, so it's unit-testable with `@gehu/testing`.
- Swap `inject(MyService)` for `injectStore(myStore)` in components. Template
  call sites (`x.count()`) are unchanged — both are signals.
- Need a fresh instance per component? `providers: [provideStore(myStore)]`.
- Replace manual `localStorage` syncing with `persist: { ... }` (it's SSR-safe).
