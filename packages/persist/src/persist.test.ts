import { describe, expect, test } from "bun:test";
import type { StorageAdapter } from "@gehu-js/core";
import { createStore, flushSync, memoryStorage } from "@gehu-js/core";
import { localStorageAdapter } from "./adapters.js";
import { persist } from "./persist.js";
import "@gehu-js/persist"; // side-effect: registers the `persist: {...}` shorthand

const counter = (storage: StorageAdapter, extra = {}) =>
	createStore(
		({ set }) => ({
			count: 0,
			inc: () => set((s) => ({ count: s.count + 1 })),
		}),
		{
			name: "counter",
			plugins: [persist({ key: "counter", storage, ...extra })],
		},
	);

describe("persist plugin", () => {
	test("saves selected state on change", () => {
		const storage = memoryStorage();
		const store = counter(storage);
		store.inc();
		store.inc();
		flushSync();
		const raw = storage.getItem("counter");
		if (!raw) throw new Error("missing counter snapshot");
		expect(JSON.parse(raw)).toEqual({
			v: 0,
			s: { count: 2 },
		});
	});

	test("loads persisted state into a new store", () => {
		const storage = memoryStorage();
		storage.setItem("counter", JSON.stringify({ v: 0, s: { count: 5 } }));
		const store = counter(storage);
		expect(store.snapshot()).toEqual({ count: 5 });
	});

	test("partial select persists only chosen keys", () => {
		const storage = memoryStorage();
		const store = createStore(
			({ set }) => ({
				items: [] as number[],
				tmp: "x",
				add: (n: number) => set((s) => ({ items: [...s.items, n] })),
			}),
			{
				name: "cart",
				plugins: [
					persist({
						key: "cart",
						storage,
						select: (s) => ({ items: (s as { items: number[] }).items }),
					}),
				],
			},
		);
		store.add(1);
		flushSync();
		const raw = storage.getItem("cart");
		if (!raw) throw new Error("missing cart snapshot");
		expect(JSON.parse(raw).s).toEqual({ items: [1] });
	});

	test("version mismatch runs migrate", () => {
		const storage = memoryStorage();
		storage.setItem("counter", JSON.stringify({ v: 0, s: { count: 5 } }));
		const store = createStore(
			({ set }) => ({
				count: 0,
				inc: () => set((s) => ({ count: s.count + 1 })),
			}),
			{
				name: "counter",
				plugins: [
					persist({
						key: "counter",
						storage,
						version: 2,
						migrate: (old) => ({
							count: (old as { count: number }).count * 10,
						}),
					}),
				],
			},
		);
		expect(store.snapshot()).toEqual({ count: 50 });
	});

	test("precedence 'hydrate' (default): hydrate wins over persisted", () => {
		const storage = memoryStorage();
		storage.setItem("counter", JSON.stringify({ v: 0, s: { count: 5 } }));
		const store = createStore(
			({ set }) => ({
				count: 0,
				inc: () => set((s) => ({ count: s.count + 1 })),
			}),
			{
				name: "counter",
				hydrate: { count: 100 },
				plugins: [persist({ key: "counter", storage })],
			},
		);
		expect(store.snapshot()).toEqual({ count: 100 });
	});

	test("precedence 'persisted': stored wins over hydrate", () => {
		const storage = memoryStorage();
		storage.setItem("counter", JSON.stringify({ v: 0, s: { count: 5 } }));
		const store = createStore(
			({ set }) => ({
				count: 0,
				inc: () => set((s) => ({ count: s.count + 1 })),
			}),
			{
				name: "counter",
				hydrate: { count: 100 },
				plugins: [persist({ key: "counter", storage, hydratePrecedence: "persisted" })],
			},
		);
		expect(store.snapshot()).toEqual({ count: 5 });
	});

	test("persist: {...} shorthand works once @gehu-js/persist is imported", () => {
		const storage = memoryStorage();
		const store = createStore(
			({ set }) => ({
				count: 0,
				inc: () => set((s) => ({ count: s.count + 1 })),
			}),
			{
				name: "sc",
				persist: { key: "sc", storage },
			},
		);
		store.inc();
		flushSync();
		const raw = storage.getItem("sc");
		if (!raw) throw new Error("missing sc snapshot");
		expect(JSON.parse(raw)).toEqual({
			v: 0,
			s: { count: 1 },
		});
	});

	test("localStorageAdapter is SSR-safe (no global → no throw, no persistence)", () => {
		// Bun has no localStorage global → adapter falls back to memory.
		expect(typeof (globalThis as Record<string, unknown>).localStorage).toBe("undefined");
		const adapter = localStorageAdapter();
		expect(() => adapter.setItem("x", "1")).not.toThrow();
		// a fresh memory-backed adapter doesn't see the previous instance's write
		expect(localStorageAdapter().getItem("x")).toBeNull();
	});
});
