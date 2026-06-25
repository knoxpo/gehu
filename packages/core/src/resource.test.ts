import { describe, expect, test } from 'bun:test';
import { createStore } from './createStore.js';

const tick = () => new Promise<void>((r) => setTimeout(r, 0));

type User = { id: string; name: string };

describe('ctx.resource', () => {
  test('manual default: no fetch until refetch()', async () => {
    let calls = 0;
    const store = createStore(({ ctx }) => ({
      user: ctx.resource<User>({
        name: 'user',
        fetch: async () => {
          calls++;
          return { id: '1', name: 'Alex' };
        },
      }),
    }));
    await tick();
    expect(calls).toBe(0); // autoRun defaults false
    expect(store.user.status()).toBe('idle');

    const result = await store.user.refetch();
    expect(result).toEqual({ id: '1', name: 'Alex' });
    expect(calls).toBe(1);
    expect(store.user.status()).toBe('success');
    expect(store.user.data()).toEqual({ id: '1', name: 'Alex' });
    expect(store.user.loading()).toBe(false);
  });

  test('idle → loading → success transitions', async () => {
    let resolve!: (u: User) => void;
    const store = createStore(({ ctx }) => ({
      user: ctx.resource<User>({ fetch: () => new Promise<User>((r) => (resolve = r)) }),
    }));
    expect(store.user.status()).toBe('idle');
    const p = store.user.refetch();
    expect(store.user.status()).toBe('loading');
    expect(store.user.loading()).toBe(true);
    resolve({ id: '1', name: 'A' });
    await p;
    expect(store.user.status()).toBe('success');
  });

  test('enabled:false gates a manual run', async () => {
    let calls = 0;
    const store = createStore(({ ctx }) => ({
      user: ctx.resource<User>({
        enabled: () => false,
        fetch: async () => {
          calls++;
          return { id: '1', name: 'A' };
        },
      }),
    }));
    await store.user.refetch();
    expect(calls).toBe(0);
    expect(store.user.status()).toBe('idle');
  });

  test('error path sets error/status', async () => {
    const store = createStore(({ ctx }) => ({
      user: ctx.resource<User>({
        fetch: async () => {
          throw new Error('boom');
        },
      }),
    }));
    await expect(store.user.refetch()).rejects.toThrow('boom');
    expect(store.user.status()).toBe('error');
    expect((store.user.error() as Error).message).toBe('boom');
  });

  test('retry recovers after N failures', async () => {
    let n = 0;
    const store = createStore(({ ctx }) => ({
      user: ctx.resource<User>({
        retry: 2,
        fetch: async () => {
          if (n++ < 2) throw new Error('flaky');
          return { id: '1', name: 'ok' };
        },
      }),
    }));
    const r = await store.user.refetch();
    expect(r).toEqual({ id: '1', name: 'ok' });
    expect(n).toBe(3); // 2 failures + 1 success
    expect(store.user.status()).toBe('success');
  });

  test('clear() resets to idle', async () => {
    const store = createStore(({ ctx }) => ({
      user: ctx.resource<User>({ fetch: async () => ({ id: '1', name: 'A' }) }),
    }));
    await store.user.refetch();
    expect(store.user.status()).toBe('success');
    store.user.clear();
    expect(store.user.status()).toBe('idle');
    expect(store.user.data()).toBeUndefined();
  });

  test('autoRun:true re-fetches on key change', async () => {
    const seen: (string | null)[] = [];
    const store = createStore(({ set, get, ctx }) => ({
      selectedId: null as string | null,
      user: ctx.resource<User>({
        autoRun: true,
        enabled: () => !!get().selectedId,
        key: () => ['user', get().selectedId],
        fetch: async () => {
          const id = get().selectedId!;
          seen.push(id);
          return { id, name: `name-${id}` };
        },
      }),
      select: (id: string) => set({ selectedId: id }),
    }));

    await tick();
    expect(seen).toEqual([]); // disabled until an id is selected

    store.select('1');
    await tick();
    expect(seen).toEqual(['1']);
    expect(store.user.data()).toEqual({ id: '1', name: 'name-1' });

    store.select('2');
    await tick();
    expect(seen).toEqual(['1', '2']);
    expect(store.user.data()).toEqual({ id: '2', name: 'name-2' });
  });

  test('autoRun: rapid key change discards the stale result', async () => {
    const store = createStore(({ set, get, ctx }) => ({
      selectedId: 'a',
      user: ctx.resource<User>({
        autoRun: true,
        key: () => [get().selectedId],
        // 'a' resolves slowly, 'b' fast → 'a' must not overwrite 'b'
        fetch: ({ signal }) =>
          new Promise<User>((resolve) => {
            const id = get().selectedId;
            const delay = id === 'a' ? 30 : 1;
            setTimeout(() => resolve({ id, name: id }), delay);
            void signal;
          }),
      }),
      select: (id: string) => set({ selectedId: id }),
    }));

    await tick(); // kick off fetch('a')
    store.select('b'); // supersede before 'a' resolves
    await new Promise<void>((r) => setTimeout(r, 50));
    expect(store.user.data()).toEqual({ id: 'b', name: 'b' });
  });

  test('snapshot excludes resources', async () => {
    const store = createStore(({ set, ctx }) => ({
      count: 0,
      user: ctx.resource<User>({ fetch: async () => ({ id: '1', name: 'A' }) }),
      inc: () => set((s) => ({ count: s.count + 1 })),
    }));
    expect(store.snapshot()).toEqual({ count: 0 });
  });
});
