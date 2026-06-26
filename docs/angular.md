# Angular

`@gehu-js/angular` maps Gehu stores onto Angular signals, so store state drives
templates natively (including zoneless). API renamed from the original
`provideVeducx` to **`provideGehu`**.

## Setup

```ts
import { bootstrapApplication } from '@angular/platform-browser';
import { provideGehu } from '@gehu-js/angular';

bootstrapApplication(AppComponent, {
  providers: [
    provideGehu({ devtools: true }),
  ],
});
```

## Inject a store

`injectStore` returns a reactive view of the store — state accessors are Angular
signals, so use them directly in templates.

```ts
import { injectStore } from '@gehu-js/angular';
import { counterStore } from './counter.store';

@Component({
  template: `
    <p>{{ counter.count() }} (×2 = {{ counter.double() }})</p>
    <button (click)="counter.inc()">+</button>
  `,
})
export class CounterComponent {
  counter = injectStore(counterStore);
}
```

By default `injectStore` resolves an **app/request-scoped instance** from the
root `provideGehu` registry — which means SSR gets per-request isolation for
free (see [ssr.md](ssr.md)).

## Component / feature scoping

`provideStore` creates a **fresh, isolated instance** for a component subtree:

```ts
@Component({
  providers: [provideStore(cartStore)],
})
export class CheckoutComponent {
  cart = injectStore(cartStore); // independent of the app-level cart
}
```

## Two modes

```ts
injectStore(store);                       // isolated (default) — Angular signals, SSR-safe
injectStore(store, { scope: 'singleton' }); // bridge the module-level singleton (shared global state)
```

Use `'singleton'` when you deliberately want one shared instance across the app
(not SSR-safe).

## Cleanup

Per-injector instances ride the Angular injector: their effects (including
resource `autoRun`) are cleaned up automatically via `DestroyRef` when the
injector is destroyed.

## Testing

`provideGehuTesting()` and `provideMockStore(store, initialState)` — see
[testing.md](testing.md).
