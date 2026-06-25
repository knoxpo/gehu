// Phase 2 demo: ctx.resource + ctx.mutation, framework-free (md §7, §8).
// Run: bun run resources.ts
import { createStore } from '@gehu/core';

type User = { id: string; name: string };

// Fake async backend — no deps, just timers.
const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
const DB: Record<string, User> = {
  '1': { id: '1', name: 'Alex' },
  '2': { id: '2', name: 'Sam' },
};
const api = {
  async getUser(id: string): Promise<User> {
    await sleep(10);
    const u = DB[id];
    if (!u) throw new Error(`no user ${id}`);
    return u;
  },
  async saveUser(u: User): Promise<User> {
    await sleep(10);
    DB[u.id] = u;
    return u;
  },
};

const store = createStore(({ set, get, ctx }) => ({
  selectedId: null as string | null,
  saved: null as User | null,

  // autoRun resource: fetches whenever selectedId changes (md §7).
  user: ctx.resource<User>({
    name: 'user',
    autoRun: true,
    enabled: () => !!get().selectedId,
    key: () => ['user', get().selectedId],
    fetch: () => api.getUser(get().selectedId!),
  }),

  // mutation, default errorSwallow:true (md §8).
  saveProfile: ctx.mutation<User, User>({
    name: 'saveProfile',
    run: (input) => api.saveUser(input),
    onSuccess: (u) => set({ saved: u }),
  }),

  // mutation that fails, default errorSwallow:true → resolves undefined.
  flakySave: ctx.mutation<User, User>({
    name: 'flakySave',
    run: async () => {
      throw new Error('network down');
    },
  }),

  // mutation that rethrows on failure.
  strictSave: ctx.mutation<User, User>({
    name: 'strictSave',
    errorSwallow: false,
    run: async () => {
      throw new Error('server rejected');
    },
  }),

  select: (id: string) => set({ selectedId: id }),
}));

const main = async () => {
  console.log('--- resource: autoRun ---');
  console.log('initial status:', store.user.status()); // idle (nothing selected)

  store.select('1');
  console.log('after select(1), status:', store.user.status()); // loading
  await sleep(30);
  console.log('resolved → status:', store.user.status(), 'data:', store.user.data());

  store.select('2');
  await sleep(30);
  console.log('after select(2) → data:', store.user.data());

  console.log('\n--- mutation: success (errorSwallow default) ---');
  const out = await store.saveProfile({ id: '3', name: 'Robin' });
  console.log('returned:', out, '| status:', store.saveProfile.status());
  console.log('store.saved:', store.saved());

  console.log('\n--- mutation: swallowed error (default) ---');
  const swallowed = await store.flakySave({ id: 'x', name: 'x' }); // does NOT throw
  console.log('returned:', swallowed, '| status:', store.flakySave.status());
  console.log('error():', (store.flakySave.error() as Error).message);

  console.log('\n--- mutation: rethrow (errorSwallow:false) ---');
  try {
    await store.strictSave({ id: 'x', name: 'x' });
    console.log('did not throw (unexpected)');
  } catch (e) {
    console.log('caught:', (e as Error).message, '| status:', store.strictSave.status());
  }

  console.log('\n--- snapshot excludes resources/mutations/actions ---');
  console.log('snapshot:', store.snapshot());
};

void main();
