# @gehu-js/testing

Framework-agnostic test helpers for Gehu stores.

`@gehu-js/testing` helps you create isolated store instances, replace resources and mutations with mocks, capture actions and state patches, and flush pending effects in tests.

## Install

```sh
npm install -D @gehu-js/testing @gehu-js/core
```

## Overview

Use this package when you want store-level tests without tying your test setup to Angular, React, Jest, or Vitest-specific helpers.

It is useful for:

- isolated unit tests
- store integration tests
- mocking async resources and mutations
- observing actions and state patches

## Main API

- `createTestStore(store, options?)` creates a fresh isolated instance for a test
- `createLinkedTestStore(store, options?)` does the same for linked stores
- `mockResource(options?)` builds a resource mock
- `mockMutation(options?)` builds a mutation mock
- `captureActions(store)` records action calls
- `capturePatches(store)` records state patches
- `flushEffects()` flushes pending core effects
- `flushResources()` flushes effects and waits for async resource work

## Example

```ts
import { createTestStore } from "@gehu-js/testing";
import { counterStore } from "./counter.store";

const testStore = createTestStore(counterStore);
testStore.value.increment();

expect(testStore.snapshot().count).toBe(1);
```

Full docs: https://github.com/knoxpo/gehu#readme
