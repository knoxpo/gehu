# @gehu/angular/ngrx-compat Example

Demonstrates **@gehu/angular/ngrx-compat**, a signal-based store API that provides an NgRx-like developer experience on top of Gehu's core engine.

## Features

- **Counter Store** — Simple state, computed signals, and methods
- **Users Store** — Async operations with caching, loading, and error handling
- **Persistence** — Counter value persists across page reloads
- **Devtools Integration** — Real-time state inspection in browser devtools
- **Zoneless** — No Zone.js, smaller bundle (130 KB production)

## Running

```bash
bun install
bun run dev
```

Then open `http://localhost:4200/`

## Store Comparison

### @gehu/angular/ngrx-compat (This Example)

```typescript
import { signalStore, withState, withComputed, withMethods } from "@gehu/angular/ngrx-compat";

@Injectable({ providedIn: "root" })
export class CounterStore extends signalStore(
  { providedIn: "root" },
  withState({ count: 0 }),
  withComputed(({ count }) => ({
    doubled: computed(() => count() * 2),
  })),
  withMethods((store) => ({
    increment() {
      patchState(store, { count: store.count() + 1 });
    },
  })),
) {}

// Usage in component
export class AppComponent {
  constructor(readonly counter: CounterStore) {}
  template: `{{ counter.count() }} — {{ counter.doubled() }}`
}
```

### @ngrx/signals Equivalent

```typescript
import { signalStore, withState, withComputed, withMethods } from "@ngrx/signals";
import { patchState } from "@ngrx/signals";

export const counterStore = signalStore(
  withState({ count: 0 }),
  withComputed(({ count }) => ({
    doubled: computed(() => count() * 2),
  })),
  withMethods(({ count }) => ({
    increment() {
      patchState(counterStore, { count: count() + 1 });
    },
  })),
);

// Usage in component
export class AppComponent {
  counter = inject(counterStore);
  template: `{{ counter.count() }} — {{ counter.doubled() }}`
}
```

### Traditional NgRx

```typescript
// actions
export const increment = createAction('[Counter] Increment');

// reducer
const initialState = { count: 0 };
export const counterReducer = createReducer(initialState, on(increment, (state) => ({ count: state.count + 1 })));

// selector
export const selectCount = createFeatureSelector<number>('counter');
export const selectDoubled = createSelector(selectCount, (count) => count * 2);

// effect (for side effects)
export const counterEffects = createEffect(() =>
  this.actions$.pipe(
    ofType(increment),
    tap(() => console.log('incremented')),
  ),
);

// Usage in component
export class AppComponent {
  count$ = this.store.select(selectCount);
  doubled$ = this.store.select(selectDoubled);
  constructor(private store: Store) {}
  template: `{{ count$ | async }} — {{ doubled$ | async }}`
}
```

## Key Differences

| Feature | Traditional NgRx | @ngrx/signals | @gehu/angular/ngrx-compat | Gehu Core |
|---------|-----------------|---------------|------------|-----------|
| **API Style** | Actions/Reducers/Effects | Signals | Signals | Store function |
| **Files per Feature** | 3+ (action, reducer, effect) | 1 | 1 | 1 |
| **Async Pattern** | Effects | Methods returning Promises | Methods returning Promises | Methods returning Promises |
| **Selectors** | createSelector | computed() | computed() | getters |
| **Component Sub** | Observable + async pipe | Direct signal call | Direct signal call | Direct signal call |
| **Boilerplate** | High | Medium | Low | Low |
| **Dev Experience** | Good | Great | Great | Great |

## Async Example: Users Store

### @gehu/angular/ngrx-compat

```typescript
@Injectable({ providedIn: "root" })
export class UsersStore extends signalStore(
  { providedIn: "root" },
  withState({ users: [], loading: false, error: null }),
  withMethods((store) => ({
    async fetchUsers() {
      patchState(store, { loading: true, error: null });
      try {
        const response = await fetch("/users");
        const data = await response.json();
        patchState(store, { users: data, loading: false });
      } catch (err) {
        patchState(store, { error: err.message, loading: false });
      }
    },
  })),
) {}

// Usage
template: `
  <button (click)="store.fetchUsers()" [disabled]="store.loading()">
    {{ store.loading() ? 'Loading...' : 'Load' }}
  </button>
  {{ store.error() }}
  @for (user of store.users()) { ... }
`
```

### @ngrx/signals + Computed Watchers

```typescript
export const usersStore = signalStore(
  withState({ users: [], loading: false, error: null }),
  withMethods((store) => ({
    async fetchUsers() {
      patchState(store, { loading: true, error: null });
      try {
        const response = await fetch("/users");
        const data = await response.json();
        patchState(store, { users: data, loading: false });
      } catch (err) {
        patchState(store, { error: err.message, loading: false });
      }
    },
  })),
);
```

Both @gehu/angular/ngrx-compat and @ngrx/signals have nearly identical APIs. The difference is **@gehu/angular/ngrx-compat is built on Gehu's core engine**, giving you:

- Smaller bundle size (Gehu is ~5KB gzipped)
- No dependency on @ngrx/signals
- Full compatibility with Gehu plugins (persist, devtools, etc.)

## See Also

- [Gehu Docs](../../docs/README.md)
- [@gehu/angular/ngrx-compat API Docs](../../docs/NGRX_COMPAT_COMPARISON.md)
- [@ngrx/signals](https://ngrx.io/guide/signals)
