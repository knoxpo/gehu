# Gehu Competitive Matrix

As of **2026-06-26**.

This is one **single unified matrix** for **Gehu**, **Zustand**, **Jotai**,
**Redux Toolkit / RTK Query**, **MobX**, and **NgRx**.

It is intentionally **not Gehu-favoring**. If another library is better for a
given metric, the table should say so directly.

## Scoring rules

- `Best`: strongest fit.
- `Strong`: very good fit.
- `OK`: usable, but not a natural strength.
- `Weak`: possible, but against the grain.
- `N/A`: not a practical fit.

Anything about **performance** here is an **expectation/inference from the
library model and official docs**, not a benchmark result.

## Unified comparison matrix

| Metric | Gehu | Zustand | Jotai | Redux Toolkit / RTK Query | MobX | NgRx |
|---|---|---|---|---|---|---|
| Tiny store simplicity | Strong | Best | Best | Weak | Strong | Weak |
| Medium cohesive feature store | Best | Strong | OK | Strong | Strong | Strong |
| Large app with many independent keys | OK | Strong | Best | Strong | Strong | Strong |
| Atom-heavy UI | Weak | OK | Best | Weak | Best | Weak |
| Deep reactive object graph | OK | OK | OK | OK | Best | OK |
| Sync read/write simplicity | Best | Best | OK | OK | Best | OK |
| Async read/write simplicity | Best | Weak | OK | Best | OK | Strong |
| Built-in async primitives | Best | Weak | OK | Best | OK | Strong |
| Fine-grained rendering potential | OK | Strong | Best | OK | Best | OK |
| Selector-based rerender control | OK | Best | OK | Strong | Weak | Strong |
| Runtime dependency tracking | Weak | Weak | OK | Weak | Best | Weak |
| Fragmented state scaling | OK | Strong | Best | Strong | Strong | Strong |
| Server-state heavy apps | OK | Weak | OK | Best | OK | Strong |
| Cache invalidation depth | OK | Weak | OK | Best | Weak | Strong |
| React ergonomics | Weak | Best | Best | Best | Strong | N/A |
| Next.js fit | Weak | Strong | Strong | Strong | OK | N/A |
| Angular support | Best | Weak | Weak | Weak | Weak | Best |
| Cross-framework core | Best | OK | OK | Best | Best | Weak |
| SSR design | Strong | OK | OK | Strong | OK | Strong |
| Scoped/request-safe state model | Best | Weak | OK | Strong | OK | Strong |
| Boilerplate for small apps | Strong | Best | Strong | Weak | Strong | Weak |
| Boilerplate for large teams | Strong | Strong | OK | Best | OK | Best |
| API simplicity | Best | Best | OK | OK | Strong | Weak to OK |
| Predictability / explicitness | Strong | Strong | OK | Best | Weak | Best |
| Devtools maturity | Weak | Strong | Strong | Best | Strong | Best |
| Testing story | Strong | OK | OK | Best | Strong | Best |
| Persistence story | Strong | Strong | Strong | OK | OK | Strong |
| Ecosystem breadth | Weak | Strong | Strong | Best | Best | Best |
| Migration familiarity | Weak | Best | Strong | Best | Strong | Best in Angular |
| Enterprise trust | Weak | Strong | Strong | Best | Best | Best |
| Bundle-size potential | Best | Best | Best | OK | OK | Weak |
| Production React maturity | Weak | Best | Best | Best | Strong | N/A |
| Production Angular maturity | Best | Weak | Weak | Weak | Weak | Best |

## Direct reading of the matrix

- **Gehu really wins** on Angular support, scoped SSR-safe state, built-in async
  primitives, medium cohesive feature stores, API simplicity, and bundle
  potential.
- **Gehu clearly loses** on React maturity, Next.js maturity, atom-heavy UI,
  deep reactive graph work versus MobX, fragmented-state work versus Jotai, and
  enterprise trust versus Redux / NgRx / MobX.
- **Zustand wins** when the goal is small-to-medium React state with very low
  ceremony.
- **Jotai wins** when the UI is atom-heavy or highly fragmented.
- **Redux Toolkit / RTK Query wins** for enterprise React and server-state-heavy
  systems.
- **MobX wins** for deep reactive object graphs and runtime dependency tracking.
- **NgRx wins** for Angular enterprise trust, tooling, and large-team patterns.

## Truthful takeaway

Gehu is **not** the best general-purpose state library today.

Gehu is strongest in this narrower zone:

- **Angular-first**
- **medium-complexity feature stores**
- **cohesive domain state**
- **built-in async reads/writes**
- **small API and bundle goals**

Outside that zone:

- pick **Zustand** for very simple React stores,
- pick **Jotai** for atom-heavy React UIs,
- pick **Redux Toolkit / RTK Query** for enterprise React and server-state depth,
- pick **MobX** for deep reactive object graphs,
- pick **NgRx** for mature Angular enterprise ecosystems.

## Improvement priority for Gehu

1. **Ship `@gehu-js/react`**
2. **Ship React + Next.js examples and docs**
3. **Ship a real devtools UI**
4. **Improve the fragmented-state / fine-grained rendering story**
5. **Deepen the server-state model**
6. **Earn trust with benchmarks, migrations, and production examples**

## Sources

### Gehu

- [README](../README.md)
- [Angular guide](./angular.md)
- [Resources guide](./resources.md)
- [Mutations guide](./mutations.md)
- [Persistence guide](./persistence.md)
- [Devtools guide](./devtools.md)
- [Testing guide](./testing.md)

### Official external docs

- [Zustand README](https://github.com/pmndrs/zustand#readme)
- [Jotai docs](https://jotai.org/docs)
- [Jotai: store outside React](https://jotai.org/docs/guides/using-store-outside-react)
- [Jotai: storage](https://jotai.org/docs/utilities/storage)
- [Jotai: Next.js](https://jotai.org/docs/guides/nextjs)
- [Redux getting started](https://redux.js.org/introduction/getting-started)
- [Redux side effects approaches](https://redux.js.org/usage/side-effects-approaches)
- [RTK Query overview](https://redux-toolkit.js.org/rtk-query/overview)
- [MobX introduction](https://mobx.js.org/README.html)
- [MobX React integration](https://mobx.js.org/react-integration.html)
- [NgRx store guide](https://ngrx.io/guide/store)
- [NgRx signals guide](https://ngrx.io/guide/signals)
