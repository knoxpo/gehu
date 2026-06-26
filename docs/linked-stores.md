# Linked stores

`linkedStore` coordinates two or more stores. It owns its own coordination state
and reads/acts across the linked stores via `stores.x`.

```ts
import { linkedStore } from '@gehu-js/core';

export const checkoutStore = linkedStore(
  {
    cart: cartStore,
    user: userStore,
    payment: paymentStore,
  },
  ({ stores, set, get, ctx }) => ({
    canCheckout: () =>
      stores.cart.items().length > 0 && !!stores.user.currentUser(),

    checkout: async () => {
      const user = stores.user.currentUser();
      const items = stores.cart.items();
      await stores.payment.charge({ user, items });
      stores.cart.clear();
    },
  }),
  { name: 'checkout', devtools: true },
);
```

## Mental model

```txt
createStore = owns state
linkedStore = coordinates stores
```

`stores.cart.items()` reads a sub-store's signal; `stores.cart.clear()` calls its
action. The linked store is strongly typed from the `stores` object you pass.

A linked store may contain cross-store computed values, cross-store actions,
workflow state, resources, mutations, and effects — same `{ stores, set, get, ctx }`
api as a regular store, plus `stores`.

## Devtools

When devtools is enabled, building a linked store emits `linkedStore.connected`
with the named sub-store edges (e.g. `{ checkout: ['cart','user','payment'] }`),
so the devtools graph can render the dependency wiring.

## Angular note

In Angular, `injectStore` on a `createStore` store gives a per-injector instance.
Linked stores currently use the singleton-bridge path under Angular (their
cross-store re-instantiation is a known limitation). For most apps you inject the
linked store at the root and the sub-stores resolve normally.
