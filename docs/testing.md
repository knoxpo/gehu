# Testing

`@gehu/testing` is **framework- and runner-agnostic** — it imports only
`@gehu/core`. Use it with Vitest, Jest, Mocha, `bun:test`, anything.

```ts
import { createTestStore } from '@gehu/testing';

const store = createTestStore(counterStore);
store.value.inc();
expect(store.snapshot()).toEqual({ count: 1 });
```

`createTestStore` builds a **fresh, isolated instance** — your test never touches
the module-level singleton.

## Seeding state

```ts
const store = createTestStore(cartStore, { hydrate: { items: [] } }); // merged over defaults
```

## Mocking resources / mutations

```ts
import { mockResource, mockMutation } from '@gehu/testing';

const store = createTestStore(usersStore, {
  resources: { user: mockResource({ data: { id: '1', name: 'Alex' } }) },
});
store.value.user.data();   // { id: '1', name: 'Alex' }
store.value.user.status(); // 'success'

const save = mockMutation({ output: { ok: true } });
await save({ name: 'A' });
save.calls; // [{ name: 'A' }]  — records inputs
```

## Flushing

```ts
import { flushEffects, flushResources } from '@gehu/testing';

store.value.inc();
flushEffects();        // run pending subscriptions synchronously
await flushResources(); // let real resource fetches settle
```

## Capturing

```ts
import { captureActions, capturePatches } from '@gehu/testing';

const actions = captureActions(store.value); // records action names when called
const patches = capturePatches(store.value); // records shallow state diffs
store.value.inc();
flushEffects();
actions.actions; // ['inc']
patches.patches; // [{ count: 1 }]
actions.stop(); patches.stop();
```

## Linked stores

```ts
import { createLinkedTestStore } from '@gehu/testing';
const test = createLinkedTestStore(checkoutStore);
```

## Angular

Angular-specific helpers live in `@gehu/angular` (so `@gehu/testing` stays
framework-free):

```ts
import { provideGehuTesting, provideMockStore } from '@gehu/angular';

TestBed.configureTestingModule({
  providers: [
    provideZonelessChangeDetection(),
    provideGehuTesting(),
    provideMockStore(cartStore, { items: [] }),
  ],
});
```

See [`packages/angular/test/adapter.test.ts`](../packages/angular/test/adapter.test.ts).
