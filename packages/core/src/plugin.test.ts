import { describe, expect, test } from 'bun:test';
import { createStore } from './createStore.js';
import { memoryStorage } from './memoryStorage.js';
import { flushSync } from './signals.js';
import type { StorePlugin } from './types.js';

describe('plugin system', () => {
  test('plugin init runs and can setState', () => {
    const seed: StorePlugin = {
      name: 'seed',
      init: (api) => api.setState({ count: 99 } as never),
    };
    const store = createStore(({ set }) => ({ count: 0, inc: () => set((s) => ({ count: s.count + 1 })) }), {
      plugins: [seed],
    });
    expect(store.count()).toBe(99);
  });

  test('plugin can subscribe to changes', () => {
    const seen: number[] = [];
    const watcher: StorePlugin = {
      name: 'watch',
      init: (api) => api.subscribe((s) => seen.push((s as { count: number }).count)),
    };
    const store = createStore(({ set }) => ({ count: 0, inc: () => set((s) => ({ count: s.count + 1 })) }), {
      plugins: [watcher],
    });
    store.inc();
    flushSync();
    expect(seen).toEqual([1]);
  });

  test('memoryStorage round-trips', () => {
    const s = memoryStorage();
    expect(s.getItem('k')).toBeNull();
    s.setItem('k', 'v');
    expect(s.getItem('k')).toBe('v');
    s.removeItem('k');
    expect(s.getItem('k')).toBeNull();
  });
});
