# Gehu documentation

| Guide | Topic |
|---|---|
| [getting-started.md](getting-started.md) | install, first store, read/update |
| [core-concepts.md](core-concepts.md) | `set` / `get` / `ctx`, config, the store mental model |
| [resources.md](resources.md) | async reads (`ctx.resource`) |
| [mutations.md](mutations.md) | async writes (`ctx.mutation`) |
| [linked-stores.md](linked-stores.md) | coordinating multiple stores |
| [angular.md](angular.md) | `provideGehu`, `injectStore`, scoping |
| [zoneless.md](zoneless.md) | zoneless change detection |
| [ssr.md](ssr.md) | server rendering, hydration, per-request isolation |
| [persistence.md](persistence.md) | `@gehu-js/persist`, storage adapters, migration |
| [devtools.md](devtools.md) | `@gehu-js/devtools` event bridge |
| [plugins.md](plugins.md) | writing your own plugin |
| [testing.md](testing.md) | `@gehu-js/testing`, mocks, capture |
| [bundle-size.md](bundle-size.md) | size budget + how to stay small |
| [migration.md](migration.md) | migration from Angular signal services and NgRx Signal Store |

## The one-paragraph mental model

```txt
createStore = owns state          set = update state
linkedStore = coordinates stores  get = read state
                                  ctx = store utilities (reset, snapshot, effect, resource, mutation)
config (2nd arg) = optional tooling (name, devtools, persist, plugins, hydrate)
```

The factory you pass to `createStore` returns one flat object mixing **state**
(plain values) and **behavior** (functions: actions, computeds, resources,
mutations). State keys become signal accessors on the store; everything else is
exposed as-is.
