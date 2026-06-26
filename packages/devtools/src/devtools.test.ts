import { afterEach, describe, expect, test } from "bun:test";
import { createStore, linkedStore } from "@gehu/core";
import { DevtoolsBus, devtools, devtoolsBus } from "./index.js";
import type { DevtoolsEvent } from "./protocol.js";

const collect = (bus: DevtoolsBus) => {
	const events: DevtoolsEvent[] = [];
	bus.subscribe((e) => events.push(e));
	return events;
};
const types = (events: DevtoolsEvent[]) => events.map((e) => e.type);

afterEach(() => {
	delete (globalThis as Record<string, unknown>).__GEHU_DEVTOOLS__;
});

describe("@gehu/devtools", () => {
	test("emits store.created + action + state events to the bus", () => {
		const bus = new DevtoolsBus();
		const events = collect(bus);
		const store = createStore(
			({ set }) => ({
				count: 0,
				inc: () => set((s) => ({ count: s.count + 1 })),
			}),
			{ name: "counter", plugins: [devtools({ bus })] },
		);
		store.inc();
		expect(types(events)).toEqual([
			"store.created",
			"action.started",
			"state.changed",
			"action.completed",
		]);
		expect(
			events.every((e) => e.store === "counter" && typeof e.at === "number"),
		).toBe(true);
	});

	test("resource + mutation events flow through", async () => {
		const bus = new DevtoolsBus();
		const events = collect(bus);
		const store = createStore(
			({ ctx }) => ({
				user: ctx.resource<string>({ name: "user", fetch: async () => "ok" }),
				save: ctx.mutation<number, number>({
					name: "save",
					run: async (n) => n,
				}),
			}),
			{ name: "s", plugins: [devtools({ bus })] },
		);
		await store.user.refetch();
		await store.save(1);
		expect(types(events)).toEqual([
			"store.created",
			"resource.loading",
			"resource.success",
			"mutation.started",
			"mutation.success",
		]);
	});

	test("exportSnapshots + linked-store graph", () => {
		const bus = new DevtoolsBus();
		const a = createStore(
			({ set }) => ({ n: 1, setN: (x: number) => set({ n: x }) }),
			{
				name: "a",
				plugins: [devtools({ bus })],
			},
		);
		linkedStore({ a }, ({ stores }) => ({ doubled: () => stores.a.n() * 2 }), {
			name: "sum",
			plugins: [devtools({ bus })],
		});
		a.setN(9);
		expect(bus.exportSnapshots()).toEqual({ a: { n: 9 }, sum: {} });
		expect(bus.graph).toEqual({ sum: ["a"] });
	});

	test("forwards to global __GEHU_DEVTOOLS__ hook", () => {
		const seen: DevtoolsEvent[] = [];
		(globalThis as Record<string, unknown>).__GEHU_DEVTOOLS__ = {
			send: (e: DevtoolsEvent) => seen.push(e),
		};
		const bus = new DevtoolsBus();
		createStore(
			({ set }) => ({
				count: 0,
				inc: () => set((s) => ({ count: s.count + 1 })),
			}),
			{
				name: "g",
				plugins: [devtools({ bus })],
			},
		);
		expect(seen.map((e) => e.type)).toContain("store.created");
	});

	test("enabled:false is silent", () => {
		const bus = new DevtoolsBus();
		const events = collect(bus);
		const store = createStore(
			({ set }) => ({
				count: 0,
				inc: () => set((s) => ({ count: s.count + 1 })),
			}),
			{
				name: "off",
				plugins: [devtools({ bus, enabled: false })],
			},
		);
		store.inc();
		expect(events).toEqual([]);
	});

	test("devtools: true shorthand works after import (uses singleton bus)", () => {
		const events = collect(devtoolsBus); // importing ./index.js registered the factory
		createStore(
			({ set }) => ({
				count: 0,
				inc: () => set((s) => ({ count: s.count + 1 })),
			}),
			{
				name: "short",
				devtools: true,
			},
		);
		expect(
			events.some((e) => e.type === "store.created" && e.store === "short"),
		).toBe(true);
	});
});
