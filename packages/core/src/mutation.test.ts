import { describe, expect, test } from 'bun:test';
import { createStore } from './createStore.js';

type Profile = { name: string };

describe('ctx.mutation', () => {
  test('success runs onSuccess + returns output, writes state', async () => {
    const store = createStore(({ set, ctx }) => ({
      profile: null as Profile | null,
      save: ctx.mutation<Profile, Profile>({
        run: async (input) => input,
        onSuccess: (p) => set({ profile: p }),
      }),
    }));
    const out = await store.save({ name: 'Alex' });
    expect(out).toEqual({ name: 'Alex' });
    expect(store.save.status()).toBe('success');
    expect(store.profile()).toEqual({ name: 'Alex' });
  });

  test('errorSwallow default: resolves undefined, sets error, calls onError', async () => {
    let onErr: unknown = null;
    const store = createStore(({ ctx }) => ({
      save: ctx.mutation<Profile, Profile>({
        run: async () => {
          throw new Error('nope');
        },
        onError: (e) => (onErr = e),
      }),
    }));
    const out = await store.save({ name: 'X' }); // must NOT throw
    expect(out).toBeUndefined();
    expect(store.save.status()).toBe('error');
    expect((store.save.error() as Error).message).toBe('nope');
    expect((onErr as Error).message).toBe('nope');
  });

  test('errorSwallow:false rethrows', async () => {
    const store = createStore(({ ctx }) => ({
      save: ctx.mutation<Profile, Profile>({
        errorSwallow: false,
        run: async () => {
          throw new Error('boom');
        },
      }),
    }));
    await expect(store.save({ name: 'X' })).rejects.toThrow('boom');
    expect(store.save.status()).toBe('error');
  });

  test('onSettled always fires', async () => {
    let settled = 0;
    const store = createStore(({ ctx }) => ({
      ok: ctx.mutation<number, number>({ run: async (n) => n, onSettled: () => settled++ }),
      bad: ctx.mutation<number, number>({
        run: async () => {
          throw new Error('e');
        },
        onSettled: () => settled++,
      }),
    }));
    await store.ok(1);
    await store.bad(1);
    expect(settled).toBe(2);
  });

  test('optimistic rollback on error', async () => {
    const store = createStore(({ set, get, ctx }) => ({
      count: 0,
      bump: ctx.mutation<void, void>({
        run: async () => {
          throw new Error('fail');
        },
        optimistic: () => {
          const prev = get().count;
          set({ count: prev + 1 });
          return () => set({ count: prev });
        },
      }),
    }));
    await store.bump();
    expect(store.count()).toBe(0); // rolled back
  });

  test('reset() returns to idle', async () => {
    const store = createStore(({ ctx }) => ({
      save: ctx.mutation<number, number>({ run: async (n) => n }),
    }));
    await store.save(1);
    expect(store.save.status()).toBe('success');
    store.save.reset();
    expect(store.save.status()).toBe('idle');
    expect(store.save.error()).toBeNull();
  });
});
