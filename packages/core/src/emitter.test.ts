import { describe, expect, test } from "bun:test";
import { createStore } from "./createStore.js";
import { linkedStore } from "./linkedStore.js";
import type { StoreEvent, StorePlugin } from "./types.js";

const capturePlugin = (sink: StoreEvent[]): StorePlugin => ({
	name: "capture",
	init: (api) => void api.onEvent((e) => sink.push(e)),
});
const types = (events: StoreEvent[]) => events.map((e) => e.type);

describe("core event emitter", () => {
	test("action emits started → state.changed → completed", () => {
		const events: StoreEvent[] = [];
		const store = createStore(
			({ set, get }) => ({
				count: 0,
				double: () => get().count * 2,
				inc: () => set((s) => ({ count: s.count + 1 })),
			}),
			{ plugins: [capturePlugin(events)] },
		);
		store.inc();
		expect(types(events)).toEqual(["action.started", "state.changed", "action.completed"]);
		const patch = (events[1] as StoreEvent).payload as { patch: unknown };
		expect(patch.patch).toEqual({ count: 1 });
		expect((events[0] as StoreEvent).target).toBe("inc");
	});

	test("action.failed on throw", () => {
		const events: StoreEvent[] = [];
		const store = createStore(
			() => ({
				boom: () => {
					throw new Error("x");
				},
			}),
			{ plugins: [capturePlugin(events)] },
		);
		expect(() => store.boom()).toThrow("x");
		expect(types(events)).toEqual(["action.started", "action.failed"]);
	});

	test("resource emits loading → success", async () => {
		const events: StoreEvent[] = [];
		const store = createStore(
			({ ctx }) => ({
				user: ctx.resource<string>({ name: "user", fetch: async () => "ok" }),
			}),
			{ plugins: [capturePlugin(events)] },
		);
		await store.user.refetch();
		expect(types(events)).toEqual(["resource.loading", "resource.success"]);
		expect((events[1] as StoreEvent).payload).toBe("ok");
	});

	test("mutation emits started → success", async () => {
		const events: StoreEvent[] = [];
		const store = createStore(
			({ ctx }) => ({
				save: ctx.mutation<number, number>({
					name: "save",
					run: async (n) => n * 2,
				}),
			}),
			{ plugins: [capturePlugin(events)] },
		);
		await store.save(5);
		expect(types(events)).toEqual(["mutation.started", "mutation.success"]);
		expect((events[1] as StoreEvent).payload).toBe(10);
	});

	test("linkedStore.connected carries sub-store names", () => {
		const events: StoreEvent[] = [];
		const a = createStore(({ set }) => ({ n: 1, setN: (x: number) => set({ n: x }) }), {
			name: "a",
		});
		const b = createStore(({ set }) => ({ m: 2, setM: (x: number) => set({ m: x }) }), {
			name: "b",
		});
		linkedStore({ a, b }, ({ stores }) => ({ total: () => stores.a.n() + stores.b.m() }), {
			name: "sum",
			plugins: [capturePlugin(events)],
		});
		expect(types(events)).toContain("linkedStore.connected");
		const ev = events.find((e) => e.type === "linkedStore.connected");
		if (!ev) throw new Error("missing linkedStore.connected event");
		expect((ev.payload as { stores: string[] }).stores).toEqual(["a", "b"]);
	});
});
