import {
	Injector,
	isSignal,
	provideZonelessChangeDetection,
	runInInjectionContext,
} from "@angular/core";
import { TestBed } from "@angular/core/testing";
import {
	GEHU_HYDRATION,
	injectStore,
	provideGehu,
	provideMockStore,
	provideStore,
} from "@gehu/angular";
import { createStore, flushSync } from "@gehu/core";
import { beforeEach, describe, expect, it } from "vitest";

const makeCounter = () =>
	createStore(
		({ set, get }) => ({
			count: 0,
			double: () => get().count * 2,
			inc: () => set((s) => ({ count: s.count + 1 })),
		}),
		{ name: "counter" },
	);

const inCtx = <T>(fn: () => T): T => TestBed.runInInjectionContext(fn);

beforeEach(() => TestBed.resetTestingModule());

describe("@gehu/angular injectStore", () => {
	it("returns a reactive store; accessors are Angular signals; actions update", () => {
		const counter = makeCounter();
		TestBed.configureTestingModule({
			providers: [provideZonelessChangeDetection(), provideGehu()],
		});
		const store = inCtx(() => injectStore(counter));

		expect(isSignal(store.count)).toBe(true);
		expect(store.count()).toBe(0);
		store.inc();
		expect(store.count()).toBe(1);
		expect(store.double()).toBe(2);
	});

	it("per-injector isolation: provideStore child is independent of root (SSR safety)", () => {
		const counter = makeCounter();
		TestBed.configureTestingModule({
			providers: [provideZonelessChangeDetection(), provideGehu()],
		});
		const root = inCtx(() => injectStore(counter));
		root.inc();
		root.inc();
		expect(root.count()).toBe(2);

		const child = Injector.create({
			providers: [provideStore(counter)],
			parent: TestBed.inject(Injector),
		});
		const scoped = runInInjectionContext(child, () => injectStore(counter));
		expect(scoped.count()).toBe(0); // fresh, isolated
		scoped.inc();
		expect(scoped.count()).toBe(1);
		expect(root.count()).toBe(2); // untouched
	});

	it("resource native path: loading is an Angular signal; manual refetch resolves", async () => {
		const userStore = createStore(
			({ get, ctx }) => ({
				selectedId: "1",
				user: ctx.resource<{ id: string }>({
					fetch: async () => ({ id: get().selectedId }),
				}),
			}),
			{ name: "users" },
		);
		TestBed.configureTestingModule({
			providers: [provideZonelessChangeDetection(), provideGehu()],
		});
		const store = inCtx(() => injectStore(userStore));

		expect(isSignal(store.user.loading)).toBe(true);
		expect(store.user.status()).toBe("idle");
		await store.user.refetch();
		expect(store.user.status()).toBe("success");
		expect(store.user.data()).toEqual({ id: "1" });
	});

	it("provideMockStore seeds state (md §16)", () => {
		const counter = makeCounter();
		TestBed.configureTestingModule({
			providers: [
				provideZonelessChangeDetection(),
				provideGehu(),
				provideMockStore(counter, { count: 41 }),
			],
		});
		const store = inCtx(() => injectStore(counter));
		expect(store.count()).toBe(41);
	});

	it("hydration: GEHU_HYDRATION seeds initial state (md §13)", () => {
		const counter = makeCounter();
		TestBed.configureTestingModule({
			providers: [
				provideZonelessChangeDetection(),
				{ provide: GEHU_HYDRATION, useValue: { counter: { count: 7 } } },
				provideGehu(),
			],
		});
		const store = inCtx(() => injectStore(counter));
		expect(store.count()).toBe(7);
	});

	it("singleton scope bridges the module-level store", () => {
		const counter = makeCounter();
		counter.inc();
		counter.inc(); // module-level singleton at 2
		TestBed.configureTestingModule({
			providers: [provideZonelessChangeDetection(), provideGehu()],
		});
		const store = inCtx(() => injectStore(counter, { scope: "singleton" }));
		expect(store.count()).toBe(2);

		counter.inc(); // mutate singleton
		flushSync(); // flush the core-effect bridge into the Angular signal
		expect(store.count()).toBe(3);
	});
});
