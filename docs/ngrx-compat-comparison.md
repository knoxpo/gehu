# @gehu-js/angular/ngrx-compat Comparison Guide

A comprehensive guide comparing traditional NgRx, @ngrx/signals, @gehu-js/angular/ngrx-compat, and Gehu's core API.

## Table of Contents

1. [Simple Counter Store](#simple-counter-store)
2. [Computed Signals & Selectors](#computed-signals--selectors)
3. [Async Operations](#async-operations)
4. [Component Integration](#component-integration)
5. [Devtools & Persistence](#devtools--persistence)
6. [Feature Comparison Table](#feature-comparison-table)

---

## Simple Counter Store

### Traditional NgRx (3+ Files)

**actions.ts**
```typescript
import { createAction } from "@ngrx/store";

export const increment = createAction("[Counter] Increment");
export const decrement = createAction("[Counter] Decrement");
export const reset = createAction("[Counter] Reset");
```

**reducer.ts**
```typescript
import { createReducer, on } from "@ngrx/store";
import { increment, decrement, reset } from "./actions";

export interface CounterState {
  count: number;
}

const initialState: CounterState = { count: 0 };

export const counterReducer = createReducer(
  initialState,
  on(increment, (state) => ({ count: state.count + 1 })),
  on(decrement, (state) => ({ count: state.count - 1 })),
  on(reset, () => ({ ...initialState })),
);
```

**store.module.ts**
```typescript
import { StoreModule } from "@ngrx/store";
import { counterReducer } from "./reducer";

@NgModule({
  imports: [StoreModule.forRoot({ counter: counterReducer })],
})
export class AppModule {}
```

### @ngrx/signals (1 File)

```typescript
import { Injectable } from "@angular/core";
import { signalStore, withState, withMethods } from "@ngrx/signals";
import { patchState } from "@ngrx/signals";

@Injectable({ providedIn: "root" })
export class CounterStore extends signalStore(
  { providedIn: "root" },
  withState({ count: 0 }),
  withMethods((store) => ({
    increment() {
      patchState(store, { count: store.count() + 1 });
    },
    decrement() {
      patchState(store, { count: store.count() - 1 });
    },
    reset() {
      patchState(store, { count: 0 });
    },
  })),
) {}
```

### @gehu-js/angular/ngrx-compat (Gehu-based, 1 File)

```typescript
import { Injectable } from "@angular/core";
import { signalStore, withState, withMethods } from "@gehu-js/angular/ngrx-compat";
import { patchState } from "@gehu-js/angular/ngrx-compat";

@Injectable({ providedIn: "root" })
export class CounterStore extends signalStore(
  { providedIn: "root" },
  withState({ count: 0 }),
  withMethods((store) => ({
    increment() {
      patchState(store, { count: store.count() + 1 });
    },
    decrement() {
      patchState(store, { count: store.count() - 1 });
    },
    reset() {
      patchState(store, { count: 0 });
    },
  })),
) {}
```

**Key Difference:** @gehu-js/angular/ngrx-compat and @ngrx/signals APIs are nearly identical. The main difference is **@gehu-js/angular/ngrx-compat is powered by Gehu's core engine** (smaller, faster, fewer dependencies).

### Gehu Core API (Native)

```typescript
import { createStore } from "@gehu-js/core";

export const counterStore = createStore(
  ({ set, get }) => ({
    count: 0,
    increment: () => set((s) => ({ count: s.count + 1 })),
    decrement: () => set((s) => ({ count: s.count - 1 })),
    reset: () => set({ count: 0 }),
  }),
  { name: "counter", devtools: true },
);
```

**Note:** Core API uses a factory function instead of class-based stores. Still provides all needed features with minimal boilerplate.

---

## Computed Signals & Selectors

### Traditional NgRx

```typescript
// selector.ts
import { createFeatureSelector, createSelector } from "@ngrx/store";

export const selectCounterFeature = createFeatureSelector<CounterState>("counter");
export const selectCount = createSelector(selectCounterFeature, (state) => state.count);
export const selectDoubled = createSelector(selectCount, (count) => count * 2);
export const selectMessage = createSelector(
  selectCount,
  (count) => `Count is ${count}`,
);
```

### @ngrx/signals

```typescript
import { computed } from "@angular/core";

@Injectable({ providedIn: "root" })
export class CounterStore extends signalStore(
  { providedIn: "root" },
  withState({ count: 0 }),
  withComputed(({ count }) => ({
    doubled: computed(() => count() * 2),
    message: computed(() => `Count is ${count()}`),
  })),
  withMethods((store) => ({
    increment() {
      patchState(store, { count: store.count() + 1 });
    },
  })),
) {}
```

### ngrx-compat

```typescript
import { computed } from "@angular/core";

@Injectable({ providedIn: "root" })
export class CounterStore extends signalStore(
  { providedIn: "root" },
  withState({ count: 0 }),
  withComputed(({ count }) => ({
    doubled: computed(() => count() * 2),
    message: computed(() => `Count is ${count()}`),
  })),
  withMethods((store) => ({
    increment() {
      patchState(store, { count: store.count() + 1 });
    },
  })),
) {}
```

### Gehu Core API

```typescript
export const counterStore = createStore(
  ({ signal, computed: comp }) => {
    const count = signal(0);
    return {
      count,
      doubled: comp(() => count() * 2),
      message: comp(() => `Count is ${count()}`),
      increment: () => count.set(count() + 1),
    };
  },
  { name: "counter" },
);
```

---

## Async Operations

### Traditional NgRx (Effects)

```typescript
// actions.ts
export const fetchUsers = createAction("[Users] Fetch Users");
export const fetchUsersSuccess = createAction(
  "[Users] Fetch Users Success",
  props<{ users: User[] }>(),
);
export const fetchUsersError = createAction(
  "[Users] Fetch Users Error",
  props<{ error: string }>(),
);

// effects.ts
@Injectable()
export class UsersEffects {
  fetchUsers$ = createEffect(() =>
    this.actions$.pipe(
      ofType(fetchUsers),
      switchMap(() =>
        fetch("/api/users")
          .then((res) => res.json())
          .then((users) => fetchUsersSuccess({ users }))
          .catch((error) => fetchUsersError({ error: error.message })),
      ),
    ),
  );

  constructor(private actions$: Actions) {}
}

// reducer.ts
const initialState = { users: [], loading: false, error: null };
export const usersReducer = createReducer(
  initialState,
  on(fetchUsers, (state) => ({ ...state, loading: true })),
  on(fetchUsersSuccess, (state, { users }) => ({
    ...state,
    users,
    loading: false,
  })),
  on(fetchUsersError, (state, { error }) => ({
    ...state,
    error,
    loading: false,
  })),
);
```

### @ngrx/signals

```typescript
@Injectable({ providedIn: "root" })
export class UsersStore extends signalStore(
  { providedIn: "root" },
  withState({ users: [], loading: false, error: null as string | null }),
  withMethods((store) => ({
    async fetchUsers() {
      patchState(store, { loading: true, error: null });
      try {
        const response = await fetch("/api/users");
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const users = await response.json();
        patchState(store, { users, loading: false });
      } catch (err) {
        patchState(store, {
          error: err instanceof Error ? err.message : "Unknown error",
          loading: false,
        });
      }
    },
  })),
) {}
```

### ngrx-compat

```typescript
@Injectable({ providedIn: "root" })
export class UsersStore extends signalStore(
  { providedIn: "root" },
  withState({ users: [], loading: false, error: null as string | null }),
  withMethods((store) => ({
    async fetchUsers() {
      patchState(store, { loading: true, error: null });
      try {
        const response = await fetch("/api/users");
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const users = await response.json();
        patchState(store, { users, loading: false });
      } catch (err) {
        patchState(store, {
          error: err instanceof Error ? err.message : "Unknown error",
          loading: false,
        });
      }
    },
  })),
) {}
```

### Gehu Core API

```typescript
export const usersStore = createStore(
  async ({ signal, set }) => {
    const users = signal<User[]>([]);
    const loading = signal(false);
    const error = signal<string | null>(null);

    return {
      users,
      loading,
      error,
      async fetchUsers() {
        set({ loading: true, error: null });
        try {
          const response = await fetch("/api/users");
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          const data = await response.json();
          set({ users: data, loading: false });
        } catch (err) {
          set({
            error: err instanceof Error ? err.message : "Unknown error",
            loading: false,
          });
        }
      },
    };
  },
  { name: "users" },
);
```

---

## Component Integration

### Traditional NgRx

```typescript
import { Observable } from "rxjs";
import { Store } from "@ngrx/store";
import { selectCount, selectDoubled } from "./selectors";

@Component({
  selector: "app-counter",
  template: `
    <p>Count: {{ count$ | async }}</p>
    <p>Doubled: {{ doubled$ | async }}</p>
    <button (click)="increment()">Increment</button>
  `,
})
export class CounterComponent {
  count$: Observable<number>;
  doubled$: Observable<number>;

  constructor(private store: Store) {
    this.count$ = this.store.select(selectCount);
    this.doubled$ = this.store.select(selectDoubled);
  }

  increment() {
    this.store.dispatch(increment());
  }
}
```

### @ngrx/signals

```typescript
import { inject } from "@angular/core";
import { CounterStore } from "./counter.store";

@Component({
  selector: "app-counter",
  template: `
    <p>Count: {{ counter.count() }}</p>
    <p>Doubled: {{ counter.doubled() }}</p>
    <button (click)="counter.increment()">Increment</button>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CounterComponent {
  counter = inject(CounterStore);
}
```

### ngrx-compat

```typescript
import { inject } from "@angular/core";
import { CounterStore } from "./counter.store";

@Component({
  selector: "app-counter",
  template: `
    <p>Count: {{ counter.count() }}</p>
    <p>Doubled: {{ counter.doubled() }}</p>
    <button (click)="counter.increment()">Increment</button>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CounterComponent {
  counter = inject(CounterStore);
}
```

### Gehu Core API

```typescript
import { injectStore } from "@gehu-js/angular";
import { counterStore } from "./counter.store";

@Component({
  selector: "app-counter",
  template: `
    <p>Count: {{ counter.count() }}</p>
    <p>Doubled: {{ counter.doubled() }}</p>
    <button (click)="counter.increment()">Increment</button>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CounterComponent {
  counter = injectStore(counterStore);
}
```

---

## Devtools & Persistence

### Traditional NgRx

```typescript
import { StoreModule } from "@ngrx/store";
import { StoreDevtoolsModule } from "@ngrx/store-devtools";

@NgModule({
  imports: [
    StoreModule.forRoot(reducers),
    StoreDevtoolsModule.instrument({ maxAge: 25 }),
  ],
})
export class AppModule {}
```

### @ngrx/signals

No built-in devtools support. Must be added separately or use browser extensions.

### ngrx-compat

```typescript
import { provideGehu } from "@gehu-js/angular";
import "@gehu-js/devtools";

export const appConfig: ApplicationConfig = {
  providers: [provideGehu({ devtools: true })],
};
```

### Gehu Core API

```typescript
import { createStore } from "@gehu-js/core";
import "@gehu-js/devtools";

export const counterStore = createStore(
  ({ set, get }) => ({
    count: 0,
    increment: () => set((s) => ({ count: s.count + 1 })),
  }),
  { name: "counter", devtools: true },
);
```

### Persistence (All Signal-Based)

**@gehu-js/angular/ngrx-compat + @gehu-js/persist**
```typescript
import { withHooks } from "@gehu-js/angular/ngrx-compat";

@Injectable({ providedIn: "root" })
export class CounterStore extends signalStore(
  { providedIn: "root" },
  withState({ count: 0 }),
  withMethods((store) => ({
    increment() {
      patchState(store, { count: store.count() + 1 });
    },
  })),
  withHooks({
    onInit() {
      const saved = localStorage.getItem("counter-count");
      if (saved) patchState(this, { count: parseInt(saved, 10) });
    },
  }),
) {}

// In component:
constructor(readonly counter: CounterStore) {}
ngOnInit() {
  effect(() => {
    localStorage.setItem("counter-count", this.counter.count().toString());
  });
}
```

---

## Feature Comparison Table

| Feature | Trad. NgRx | @ngrx/signals | @gehu-js/angular/ngrx-compat | Gehu Core |
|---------|-----------|---------------|-----------|-----------|
| **Files per Feature** | 3-5 | 1 | 1 | 1 |
| **Type Safety** | Good | Excellent | Excellent | Good |
| **Signal-Based** | ❌ | ✅ | ✅ | ✅ |
| **Class-Based** | ✅ | ✅ | ✅ | ❌ |
| **Async Methods** | Effects (RxJS) | Async methods | Async methods | Async methods |
| **Devtools** | ✅ Built-in | ❌ | ✅ Built-in | ✅ Built-in |
| **Persistence Plugin** | ❌ | ❌ | ✅ | ✅ |
| **Bundle Size** | ~50KB | ~10KB | ~5KB | ~3KB |
| **Learning Curve** | Steep | Moderate | Low | Low |
| **API Stability** | Stable | Stable | Stable | Stable |
| **Community** | Large | Growing | Small | Growing |
| **Documentation** | Excellent | Good | Good | Good |

---

## When to Use Each

### Traditional NgRx
- **Large team** with NgRx expertise
- **Complex state** with many cross-cutting concerns
- **Existing NgRx codebase** (migration cost too high)
- **Need** for time-travel debugging & effects middleware

### @ngrx/signals
- **Modern Angular** projects (Angular 16+)
- **Want** signals + type-safe API + NgRx ecosystem
- **Comfortable** with @ngrx dependencies

### @gehu-js/angular/ngrx-compat ⭐ (Recommended)
- **Want** @ngrx/signals-like DX but **smaller bundle**
- **Prefer** Gehu ecosystem (devtools, persist plugins)
- **Building** new signal-based stores in existing Gehu projects
- **Drop-in replacement** for @ngrx/signals teams

### Gehu Core API
- **Maximum simplicity** (no unnecessary abstractions)
- **Store-as-a-function** pattern
- **Minimal dependencies** (pure JavaScript/TypeScript)
- **Working** outside Angular (Vanilla JS, React, etc.)

---

## Migration Path

```
Traditional NgRx
    ↓
@ngrx/signals (modern NgRx)
    ↓
@gehu-js/angular/ngrx-compat (NgRx DX, Gehu engine)
    ↓
Gehu Core API (ultimate simplicity)
```

Each step reduces boilerplate and bundle size while maintaining (or improving) developer experience.

---

## See Also

- [Gehu Documentation](./README.md)
- [@gehu-js/angular/ngrx-compat Example](../examples/angular-ngrx-compat/)
- [@ngrx/signals Guide](https://ngrx.io/guide/signals)
- [Angular Signals Guide](https://angular.io/guide/signals)
