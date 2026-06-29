<p align="center" style="text-align: center;">
  <img src="docs/logo.png" alt="Gehu Logo" width="340" />
</p>

# Gehu

> **Simple. Signal-powered. Angular-first. Platform-agnostic.**

Gehu is a modern state management ecosystem built around a **flat, intuitive API**, **signal-based reactivity**, and a **platform-agnostic core**. It is designed to provide the simplicity of Zustand while embracing Angular's signal ecosystem, zoneless applications, and SSR-first development.

The philosophy behind Gehu is straightforward:

- Build a tiny, framework-independent core.
- Provide first-class Angular integration.
- Keep tooling optional.
- Deliver excellent TypeScript inference.
- Maintain zero runtime dependencies.
- Optimize for performance, tree-shaking, and developer experience.

---

# Why Gehu?

Most state management libraries force developers into one of two extremes:

- Too much boilerplate.
- Too much magic.

Gehu aims for the middle ground.

Instead of introducing new architectural concepts, Gehu keeps state management familiar:

- State lives in stores.
- Stores expose actions.
- Derived values are simple.
- Async operations are first-class.
- Tooling stays optional.

The result is a library that scales from small applications to enterprise systems without changing how developers think.

---

# Design Principles

Gehu follows a few non-negotiable principles:

- Flat APIs over deeply nested configuration.
- Platform-agnostic core.
- Angular-first, not Angular-only.
- Zero runtime dependencies.
- SSR-safe by default.
- Zoneless-ready.
- Tree-shakable.
- ESM-first.
- Strong TypeScript inference.
- Optional tooling.
- Performance before convenience.


## Packages

| Package | Current | Next | What | Size (gzip) |
|---|---|---|---|---|
| [`@gehu-js/core`](packages/core) | ![npm current version](https://img.shields.io/npm/v/%40gehu-js%2Fcore?label=latest) | ![npm next version](https://img.shields.io/npm/v/%40gehu-js%2Fcore/next?label=next&color=orange) | platform-agnostic store engine, signals, resources, mutations, linked stores, plugin system | ~2–3 KB |
| [`@gehu-js/angular`](packages/angular) | ![npm current version](https://img.shields.io/npm/v/%40gehu-js%2Fangular?label=latest) | ![npm next version](https://img.shields.io/npm/v/%40gehu-js%2Fangular/next?label=next&color=orange) | `provideGehu` / `injectStore`, Angular signal adapter, SSR, zoneless | ~2.4 KB |
| [`@gehu-js/react`](packages/react) | ![npm current version](https://img.shields.io/npm/v/%40gehu-js%2Freact?label=latest) | ![npm next version](https://img.shields.io/npm/v/%40gehu-js%2Freact/next?label=next&color=orange) | React hooks, provider scoping, SSR hydration helpers, server entry | ~2 KB |
| [`@gehu-js/persist`](packages/persist) | ![npm current version](https://img.shields.io/npm/v/%40gehu-js%2Fpersist?label=latest) | ![npm next version](https://img.shields.io/npm/v/%40gehu-js%2Fpersist/next?label=next&color=orange) | persistence plugin + storage adapters | ~1.2 KB |
| [`@gehu-js/devtools`](packages/devtools) | ![npm current version](https://img.shields.io/npm/v/%40gehu-js%2Fdevtools?label=latest) | ![npm next version](https://img.shields.io/npm/v/%40gehu-js%2Fdevtools/next?label=next&color=orange) | event bridge (no UI) | ~0.9 KB |
| [`@gehu-js/testing`](packages/testing) | ![npm current version](https://img.shields.io/npm/v/%40gehu-js%2Ftesting?label=latest) | ![npm next version](https://img.shields.io/npm/v/%40gehu-js%2Ftesting/next?label=next&color=orange) | framework- & runner-agnostic test helpers | ~1.6 KB |


## Docs

Start at [docs/README.md](docs/README.md):

- [Getting started](docs/getting-started.md)
- [Core concepts](docs/core-concepts.md) · [Resources](docs/resources.md) · [Mutations](docs/mutations.md) · [Linked stores](docs/linked-stores.md)
- [Angular](docs/angular.md) · [Zoneless](docs/zoneless.md) · [SSR](docs/ssr.md)
- [Releasing](docs/releasing.md) · [Release checklist](RELEASE_CHECKLIST.md)
- [Persistence](docs/persistence.md) · [Devtools](docs/devtools.md) · [Plugins](docs/plugins.md) · [Testing](docs/testing.md)
- [Bundle size](docs/bundle-size.md) · [Migration](docs/migration.md)


## Examples

- [`examples/vanilla`](examples/vanilla) — counter, resources, persistence, devtools (run with `bun`)
- [`examples/angular-basic`](examples/angular-basic) — CSR
- [`examples/angular-zoneless`](examples/angular-zoneless) — zoneless change detection
- [`examples/angular-ssr`](examples/angular-ssr) — server-side rendering + hydration
- [`examples/react-vite`](examples/react-vite) — React + Vite
- [`examples/react-next`](examples/react-next) — Next.js + SSR-friendly registry flow
- [`examples/angular-ngrx-compat`](examples/angular-ngrx-compat) — migration-oriented ngrx compatibility example


## Develop

```sh
bun install
bun run build        # tsc -> ESM + d.ts for every package
bun run typecheck
bun run test:ci      # all package tests, including React and Angular adapter suites
bun run release:pack-check
```

## Release

Gehu publishes each library in `packages/*` as a separate npm package.

- Stable tags like `v1.2.3` publish to npm `latest`
- Prerelease tags like `v1.2.3-next.0` publish to npm `next`
- CI runs on pull requests and pushes to `main`
- Publish runs from GitHub Actions with npm trusted publishing and `npm publish --provenance`

Release docs:

- [docs/releasing.md](docs/releasing.md)
- [RELEASE_CHECKLIST.md](RELEASE_CHECKLIST.md)


## Design rules

Zero runtime dependencies · ESM-first · `sideEffects: false` · tree-shakable ·
no browser-only APIs in core · no global mutable stores on SSR · works in Bun,
Node, browser, SSR, and tests.

---

# Features

## Platform-agnostic Core

The Gehu core contains no Angular-specific logic.

It can run in:

- Browser
- Node.js
- Bun
- Server-side rendering
- Future framework adapters


## Angular-first Integration

Gehu provides a dedicated Angular adapter with:

- Dependency Injection support
- Signal integration
- Zoneless compatibility
- Angular SSR support
- Scoped stores
- Simple providers


## Flat Store API

Stores are intentionally simple.

```ts
const counterStore = createStore(
  ({ set, get, ctx }) => ({
    count: 0,

    double: () => get().count * 2,

    increment: () =>
      set(state => ({
        count: state.count + 1,
      })),

    reset: () => ctx.reset(),
  }),
  {
    name: "counter",
    devtools: true,
  }
);
```

The API remains flat and easy to understand.


## Linked Stores

Coordinate multiple stores without tightly coupling them.

```ts
const checkoutStore = linkedStore(
  {
    cart: cartStore,
    user: userStore,
  },
  ({ stores }) => ({
    canCheckout: () =>
      stores.cart.items().length > 0 &&
      !!stores.user.currentUser(),
  })
);
```


## Resources

Manage asynchronous reads with first-class support.

```ts
const store = createStore(({ ctx }) => ({
  users: ctx.resource({
    name: "users",
    fetch: () => api.users.list(),
  }),
}));
```

Resources expose:

- data
- loading
- error
- status
- refetch()
- clear()


## Mutations

Model asynchronous writes cleanly.

```ts
const store = createStore(({ ctx }) => ({
  saveUser: ctx.mutation({
    name: "saveUser",
    run: api.saveUser,
  }),
}));
```

Mutations expose:

- loading
- error
- status
- reset()


## SSR Ready

Gehu is designed for modern server-side rendering.

Supports:

- Angular SSR
- React SSR / Next.js hydration flows
- Bun
- Node.js
- Browser hydration
- Per-request store instances


## Zoneless Ready

Built with modern Angular applications in mind.

Gehu works naturally with Angular's zoneless change detection model.


## TypeScript First

The API is designed to maximize inference and minimize explicit generics.

Most users should rarely need to specify types manually.


## Zero Runtime Dependencies

The runtime core intentionally avoids third-party runtime dependencies.

Benefits include:

- Smaller bundles
- Faster installs
- Better control over performance
- Easier long-term maintenance

---

# Package Structure

```text
@gehu-js/core
Platform-agnostic state engine

@gehu-js/angular
Angular integration

@gehu-js/react
React integration

@gehu-js/testing
Framework-agnostic testing utilities

@gehu-js/devtools
Runtime devtools bridge

@gehu-js/persist
Persistence adapters
```

---

# Repository Structure

```text
gehu/

packages/
    core/
    angular/
    react/
    testing/
    devtools/
    persist/

examples/
docs/
tooling/
```

---

# Project Goals

Gehu aims to become:

- The simplest state management library for Angular.
- A reusable state engine for multiple frameworks.
- An excellent developer experience.
- Lightweight enough for small projects.
- Powerful enough for enterprise applications.

---

# Performance Targets

| Package | Target (gzip) |
|----------|---------------:|
| @gehu-js/core | 4–8 KB |
| @gehu-js/angular | 2–5 KB |
| @gehu-js/react | 2–4 KB |
| @gehu-js/testing | 2–4 KB |
| @gehu-js/devtools | 2–5 KB |
| @gehu-js/persist | 1–3 KB |

Overall runtime target:

**Under 25 KB gzip**

---

# License

LGPL

---

# Status

🚧 **Gehu is currently under active development.**

The project is being built incrementally following a phased architecture with a strong focus on stability, performance, and developer experience.

Contributions, discussions, and feedback will be welcomed once the initial public release is available.
