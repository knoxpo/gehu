import { computed } from "@angular/core";
import { signalStore, withState, withComputed, withMethods, patchState } from "@gehu/angular/ngrx-compat";

export const CounterStore = signalStore(
	withState({ count: 0 }),
	withComputed(({ count }) => ({
		doubled: computed(() => count() * 2),
		message: computed(() => `Count is ${count()}`),
	})),
	withMethods((store) => ({
		increment() {
			patchState(store, { count: store.count() + 1 });
		},
		decrement() {
			patchState(store, { count: store.count() - 1 });
		},
		reset() {
			patchState(store, { count: 0 });
		},
		loadFromStorage() {
			const saved = localStorage.getItem("counter-count");
			if (saved) {
				patchState(store, { count: parseInt(saved, 10) });
			}
		},
	})),
);
