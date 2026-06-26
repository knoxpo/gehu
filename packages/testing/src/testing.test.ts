import { describe, expect, test } from "bun:test";
import { createStore, linkedStore } from "@gehu-js/core";
import {
	captureActions,
	capturePatches,
	createLinkedTestStore,
	createTestStore,
	flushEffects,
	flushResources,
	mockMutation,
	mockResource,
} from "./index.js";

const counterStore = createStore(
	({ set, get, ctx }) => ({
		count: 0,
		double: () => get().count * 2,
		inc: () => set((s) => ({ count: s.count + 1 })),
		reset: () => ctx.reset(),
	}),
	{ name: "counter" },
);

describe("createTestStore", () => {
	test("isolated instance — does not touch the original (md §16)", () => {
		const store = createTestStore(counterStore);
		store.value.inc();
		expect(store.snapshot()).toEqual({ count: 1 });
		expect(counterStore.snapshot()).toEqual({ count: 0 }); // original untouched
	});

	test("hydrate merges over defaults", () => {
		const store = createTestStore(counterStore, { hydrate: { count: 10 } });
		expect(store.snapshot()).toEqual({ count: 10 });
	});

	test("mockResource overrides a resource", () => {
		const usersStore = createStore(
			({ get, ctx }) => ({
				selectedId: "1",
				user: ctx.resource<{ id: string; name: string }>({
					fetch: async () => ({ id: get().selectedId, name: "real" }),
				}),
			}),
			{ name: "users" },
		);
		const store = createTestStore(usersStore, {
			resources: { user: mockResource({ data: { id: "1", name: "Alex" } }) },
		});
		expect(store.value.user.data()).toEqual({ id: "1", name: "Alex" });
		expect(store.value.user.status()).toBe("success");
	});
});

describe("mocks", () => {
	test("mockMutation records calls + returns output", async () => {
		const save = mockMutation<{ name: string }, { ok: boolean }>({
			output: { ok: true },
		});
		const out = await save({ name: "A" });
		expect(out).toEqual({ ok: true });
		expect(save.calls).toEqual([{ name: "A" }]);
	});
});

describe("flush", () => {
	test("flushEffects drains subscriptions", () => {
		const store = createTestStore(counterStore);
		const seen: number[] = [];
		store.subscribe((s) => seen.push((s as { count: number }).count));
		store.value.inc();
		flushEffects();
		expect(seen).toEqual([1]);
	});

	test("flushResources settles a real fetch", async () => {
		const usersStore = createStore(
			({ ctx }) => ({
				user: ctx.resource<string>({
					autoRun: true,
					fetch: async () => "loaded",
				}),
			}),
			{ name: "u2" },
		);
		const store = createTestStore(usersStore);
		await flushResources();
		expect(store.value.user.data()).toBe("loaded");
	});
});

describe("capture", () => {
	test("captureActions records action names, not signal reads", () => {
		const store = createTestStore(counterStore);
		const cap = captureActions(store.value);
		store.value.count(); // signal read — not recorded
		store.value.inc();
		store.value.inc();
		store.value.reset();
		cap.stop();
		expect(cap.actions).toEqual(["inc", "inc", "reset"]);
	});

	test("capturePatches records shallow diffs", () => {
		const store = createTestStore(counterStore);
		const cap = capturePatches(store.value);
		store.value.inc();
		flushEffects();
		store.value.inc();
		flushEffects();
		cap.stop();
		expect(cap.patches).toEqual([{ count: 1 }, { count: 2 }]);
	});
});

describe("createLinkedTestStore", () => {
	test("builds a fresh linked instance", () => {
		const a = createStore(({ set }) => ({ n: 1, setN: (x: number) => set({ n: x }) }), {
			name: "a",
		});
		const b = createStore(({ set }) => ({ m: 2, setM: (x: number) => set({ m: x }) }), {
			name: "b",
		});
		const sum = linkedStore(
			{ a, b },
			({ stores }) => ({ total: () => stores.a.n() + stores.b.m() }),
			{ name: "sum" },
		);
		const test = createLinkedTestStore(sum);
		expect(test.value.total()).toBe(3);
	});
});
