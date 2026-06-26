import { describe, expect, test } from "bun:test";
import { createStore } from "./createStore.js";
import { linkedStore } from "./linkedStore.js";
import { defaultAdapter, flushSync } from "./signals.js";

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

	test("unrelated top-level updates do not invalidate other key readers", () => {
		const store = createStore(({ set }) => ({
			a: 1,
			b: 1,
			setA: (a: number) => set({ a }),
			setB: (b: number) => set({ b }),
		}));
		const seen: number[] = [];
		const dispose = defaultAdapter.effect(() => {
			seen.push(store.a());
		});
		expect(seen).toEqual([1]);
		store.setB(2);
		flushSync();
		expect(seen).toEqual([1]);
		store.setA(3);
		flushSync();
		expect(seen).toEqual([1, 3]);
		dispose();
	});

	test("select tracks targeted state with selector equality", () => {
		const store = createStore(({ set }) => ({
			user: { name: "alex", age: 1 },
			setUser: (user: { name: string; age: number }) => set({ user }),
		}));
		const nameLength = store.select((s) => s.user.name.length);
		expect(nameLength()).toBe(4);
		store.setUser({ name: "john", age: 2 });
		flushSync();
		expect(nameLength()).toBe(4);
		store.setUser({ name: "johnny", age: 3 });
		flushSync();
		expect(nameLength()).toBe(6);
	});

	test("selector subscribe fires only when selected value changes", () => {
		const store = createStore(({ set }) => ({
			user: { name: "alex", age: 1 },
			setUser: (user: { name: string; age: number }) => set({ user }),
		}));
		const seen: number[] = [];
		store.subscribe(
			(s) => s.user.name.length,
			(value) => seen.push(value),
		);
		flushSync();
		expect(seen).toEqual([]);
		store.setUser({ name: "john", age: 2 });
		flushSync();
		expect(seen).toEqual([]);
		store.setUser({ name: "johnny", age: 3 });
		flushSync();
		expect(seen).toEqual([6]);
	});

	test("pick reads nested paths from the owning branch", () => {
		const store = createStore(({ set }) => ({
			user: { profile: { name: "alex" } },
			setUser: (user: { profile: { name: string } }) => set({ user }),
		}));
		const picked = store.pick("user.profile.name");
		expect(picked()).toBe("alex");
		store.setUser({ profile: { name: "sam" } });
		flushSync();
		expect(picked()).toBe("sam");
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
			canCheckout: () => stores.cart.items().length > 0 && !!stores.user.currentUser(),
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
