import {
	Injector,
	inject,
	isSignal,
	provideZonelessChangeDetection,
	runInInjectionContext,
} from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { injectStore, provideGehu, provideStore } from "@gehu-js/angular";
import {
	patchState,
	signalStore,
	withComputed,
	withHooks,
	withMethods,
	withProps,
	withState,
} from "@gehu-js/angular/ngrx-compat";
import { beforeEach, describe, expect, it, vi } from "vitest";

const inCtx = <T>(fn: () => T): T => TestBed.runInInjectionContext(fn);

beforeEach(() => TestBed.resetTestingModule());

describe("@gehu-js/angular/ngrx-compat", () => {
	it("supports providers:[Store] + inject(Store) with state, computed, props, and methods", () => {
		const CounterStore = signalStore(
			{ name: "compat-counter" },
			withState({ count: 0 }),
			withProps(() => ({ label: "counter" })),
			withComputed(({ count }) => ({ double: () => count() * 2 })),
			withMethods((store) => ({
				increment(): void {
					patchState(store, (state: { count: number }) => ({
						count: state.count + 1,
					}));
				},
			})),
		);

		TestBed.configureTestingModule({
			providers: [provideZonelessChangeDetection(), CounterStore],
		});

		const store = inCtx(() => inject(CounterStore));

		expect(isSignal(store.count)).toBe(true);
		expect(isSignal(store.double)).toBe(true);
		expect(store.label).toBe("counter");
		expect(store.count()).toBe(0);
		expect(store.double()).toBe(0);

		store.increment();
		expect(store.count()).toBe(1);
		expect(store.double()).toBe(2);
	});

	it("runs hooks in the injector lifecycle", () => {
		const onInit = vi.fn();
		const onDestroy = vi.fn();
		const HookStore = signalStore(
			withState({ count: 0 }),
			withMethods((store) => ({
				increment(): void {
					patchState(store, { count: store.count() + 1 });
				},
			})),
			withHooks((store) => ({
				onInit: () => {
					onInit();
					store.increment();
				},
				onDestroy,
			})),
		);

		TestBed.configureTestingModule({
			providers: [provideZonelessChangeDetection(), provideGehu()],
		});

		const injector = Injector.create({
			providers: [HookStore],
			parent: TestBed.inject(Injector),
		});

		const store = runInInjectionContext(injector, () => inject(HookStore));

		expect(onInit).toHaveBeenCalledTimes(1);
		expect(store.count()).toBe(1);

		injector.destroy();
		expect(onDestroy).toHaveBeenCalledTimes(1);
	});

	it("works through provideGehu + injectStore and stays isolated across scoped providers", () => {
		const CounterStore = signalStore(
			{ name: "compat-scoped" },
			withState({ count: 0 }),
			withComputed(({ count }) => ({ double: () => count() * 2 })),
			withMethods((store) => ({
				increment(): void {
					patchState(store, { count: store.count() + 1 });
				},
			})),
		);

		TestBed.configureTestingModule({
			providers: [provideZonelessChangeDetection(), provideGehu()],
		});

		const root = inCtx(() => injectStore(CounterStore));
		root.increment();
		root.increment();
		expect(root.count()).toBe(2);
		expect(root.double()).toBe(4);

		const child = Injector.create({
			providers: [provideStore(CounterStore)],
			parent: TestBed.inject(Injector),
		});
		const scoped = runInInjectionContext(child, () => injectStore(CounterStore));

		expect(scoped.count()).toBe(0);
		scoped.increment();
		expect(scoped.count()).toBe(1);
		expect(root.count()).toBe(2);
	});
});
