import { computed, isSignal, provideZonelessChangeDetection } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { provideGehu, provideStore } from "@gehu-js/angular";
import {
	patchState,
	signalStore,
	withComputed,
	withMethods,
	withState,
} from "@gehu-js/angular/ngrx-compat";
import { describe, expect, it } from "vitest";

const CounterStore = signalStore(
	{ name: "counter" },
	withState({ count: 0 }),
	withComputed(({ count }) => ({
		doubled: computed(() => count() * 2),
	})),
	withMethods((store) => ({
		inc() {
			patchState(store, { count: store.count() + 1 });
		},
	})),
);

describe("compat reactivity repro", () => {
	it("doubled tracks count after patchState", () => {
		TestBed.configureTestingModule({
			providers: [provideZonelessChangeDetection(), provideGehu(), provideStore(CounterStore)],
		});
		const s = TestBed.runInInjectionContext(() => TestBed.inject(CounterStore));
		expect(isSignal(s.count)).toBe(true);
		expect(isSignal(s.doubled)).toBe(true);
		expect(s.count()).toBe(0);
		expect(s.doubled()).toBe(0);
		s.inc();
		expect(s.count()).toBe(1); // does state update?
		expect(s.doubled()).toBe(2); // does the derived computed track?
	});
});
