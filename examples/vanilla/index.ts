// Proves @gehu/core works outside any framework (md §10). Run: bun run index.ts
import { createStore } from '@gehu/core';

const counter = createStore(
  ({ set, get, ctx }) => ({
    count: 0,
    double: () => get().count * 2,
    inc: () => set((s) => ({ count: s.count + 1 })),
    reset: () => ctx.reset(),
  }),
  { name: 'counter' },
);

console.log('count:', counter.count(), 'double:', counter.double());
counter.inc();
counter.inc();
counter.inc();
console.log('after 3x inc → count:', counter.count(), 'double:', counter.double());
console.log('snapshot:', counter.snapshot());
counter.reset();
console.log('after reset → snapshot:', counter.snapshot());
