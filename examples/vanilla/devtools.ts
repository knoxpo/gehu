// Phase 6 demo: devtools event bridge (md §15), framework-free.
// Run: bun run devtools.ts
import { createStore } from '@gehu/core';
import { devtools, devtoolsBus } from '@gehu/devtools';

const timeline: string[] = [];
devtoolsBus.subscribe((e) => timeline.push(`${e.type}${e.target ? `(${e.target})` : ''} @${e.store}`));

const store = createStore(
  ({ set, get, ctx }) => ({
    count: 0,
    inc: () => set((s) => ({ count: s.count + 1 })),
    user: ctx.resource<string>({ name: 'user', fetch: async () => 'Alex' }),
  }),
  { name: 'demo', plugins: [devtools()] },
);

const main = async () => {
  store.inc();
  store.inc();
  await store.user.refetch();

  console.log('event timeline:');
  for (const line of timeline) console.log('  ', line);
  console.log('\nregistry snapshot:', devtoolsBus.exportSnapshots());
};

void main();
