import { describe, expect, test } from "bun:test";
import { createStore } from "./createStore.js";
import { linkedStore } from "./linkedStore.js";
import { flushSync } from "./signals.js";

type CartItem = { id: string; price: number };

const makeCounter = (config = {}) =>
	createStore(
		({ set, get, ctx }) => ({
			count: 0,
			double: () => get().count * 2,
			inc: () => set((s) => ({ count: s.count + 1 })),
			reset: () => ctx.reset(),
		}),
		{ name: "counter", ...config },
	);

describe("createStore", () => {
	test("inc then snapshot equals { count: 1 } (md §16)", () => {
		const store = makeCounter();
		store.inc();
		expect(store.snapshot()).toEqual({ count: 1 });
	});

	test("computed reflects state", () => {
		const store = makeCounter();
		expect(store.double()).toBe(0);
		store.inc();
		store.inc();
		expect(store.double()).toBe(4);
	});

	test("signal accessor reads state", () => {
		const store = makeCounter();
		expect(store.count()).toBe(0);
		store.inc();
		expect(store.count()).toBe(1);
	});

	test("ctx.reset restores initial", () => {
		const store = makeCounter();
		store.inc();
		store.inc();
		store.reset();
		expect(store.snapshot()).toEqual({ count: 0 });
	});

	test("subscribe fires on set, not initially", () => {
		const store = makeCounter();
		const seen: number[] = [];
		store.subscribe((s) => seen.push((s as { count: number }).count));
		flushSync();
		expect(seen).toEqual([]); // no initial fire
		store.inc();
		flushSync();
		expect(seen).toEqual([1]);
	});

	test("hydrate seeds initial state", () => {
		const store = makeCounter({ hydrate: { count: 41 } });
		expect(store.snapshot()).toEqual({ count: 41 });
		store.inc();
		expect(store.snapshot()).toEqual({ count: 42 });
		store.reset();
		expect(store.snapshot()).toEqual({ count: 41 }); // reset → hydrated baseline
	});

	test("object set shallow-merges", () => {
		const cart = createStore(({ set, get }) => ({
			items: [] as CartItem[],
			tag: "a",
			total: () => get().items.reduce((n: number, i: CartItem) => n + i.price, 0),
			add: (item: CartItem) => set((s) => ({ items: [...s.items, item] })),
			clear: () => set({ items: [] }),
		}));
		cart.add({ id: "1", price: 10 });
		cart.add({ id: "2", price: 5 });
		expect(cart.total()).toBe(15);
		expect(cart.snapshot()).toEqual({
			items: [
				{ id: "1", price: 10 },
				{ id: "2", price: 5 },
			],
			tag: "a",
		});
		cart.clear();
		expect(cart.total()).toBe(0);
		expect(cart.snapshot().tag).toBe("a"); // untouched key preserved
	});
});

describe("linkedStore", () => {
	test("cross-store computed reads two stores", () => {
		const cart = createStore(({ set }) => ({
			items: [] as CartItem[],
			add: (i: CartItem) => set((s) => ({ items: [...s.items, i] })),
			clear: () => set({ items: [] }),
		}));
		const user = createStore(({ set }) => ({
			currentUser: null as string | null,
			login: (name: string) => set({ currentUser: name }),
		}));

		const checkout = linkedStore({ cart, user }, ({ stores }) => ({
			canCheckout: () =>
				stores.cart.items().length > 0 && !!stores.user.currentUser(),
		}));

		expect(checkout.canCheckout()).toBe(false);
		cart.add({ id: "1", price: 10 });
		expect(checkout.canCheckout()).toBe(false);
		user.login("alex");
		expect(checkout.canCheckout()).toBe(true);
		cart.clear();
		expect(checkout.canCheckout()).toBe(false);
	});
});
