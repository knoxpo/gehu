# @gehu-js/angular

Angular integration for Gehu stores.

`@gehu-js/angular` connects `@gehu-js/core` to Angular signals, dependency injection, scoped providers, zoneless apps, and SSR hydration.

## Install

```sh
npm install @gehu-js/angular @gehu-js/core
```

## Overview

Use this package when your store lifecycle should follow Angular’s injector tree instead of a single module-level singleton.

It gives you:

- `provideGehu()` for root setup
- `provideStore()` for scoped store instances
- `injectStore()` for consumption inside Angular code
- hydration helpers for SSR
- an `ngrx-compat` subpath for NgRx-style migration scenarios

## Main API

- `provideGehu(config?)` sets up the Gehu registry and optional hydration data
- `provideStore(store, opts?)` registers a store in the active injector scope
- `provideMockStore()` and `provideGehuTesting()` help with Angular tests
- `injectStore(store, opts?)` resolves either the scoped instance or the singleton fallback
- `dehydrate(stores)` serializes named store snapshots for SSR
- `bridgeStore(store, destroyRef)` bridges singleton Gehu stores into Angular signals
- `angularSignalAdapter` exposes the Angular-based signal adapter used internally
- `GehuRegistry` manages scoped store instances

## Example

```ts
import { bootstrapApplication } from "@angular/platform-browser";
import { provideGehu, provideStore, injectStore } from "@gehu-js/angular";
import { counterStore } from "./counter.store";

bootstrapApplication(AppComponent, {
  providers: [provideGehu(), provideStore(counterStore)],
});

const counter = injectStore(counterStore);
counter.increment();
```

## Package exports

- `@gehu-js/angular`
- `@gehu-js/angular/ngrx-compat`

Full docs: https://github.com/knoxpo/gehu#readme
