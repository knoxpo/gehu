// Bridges a core-signal store (the module-level singleton) into Angular signals.
// Used by injectStore({ scope: 'singleton' }) and as a fallback when no
// provideGehu is in scope. The native (isolated) path needs none of this — there
// the store is built with the Angular adapter and is already Angular-reactive.
import { type DestroyRef, type Signal, signal } from "@angular/core";
import type { Store } from "@gehu-js/core";
import { defaultAdapter, isMutation, isResource } from "@gehu-js/core";

type Dict = Record<string, unknown>;

function toNg<V>(read: () => V, destroyRef: DestroyRef): Signal<V> {
	const s = signal(read());
	// core effect tracks the core signals read in `read()` and pushes into Angular.
	const dispose = defaultAdapter.effect(() => s.set(read()));
	destroyRef.onDestroy(dispose);
	return s;
}

export function bridgeStore<T>(store: Store<T>, destroyRef: DestroyRef): Store<T> {
	const src = store as unknown as Dict;
	const stateKeys = new Set(Object.keys((src.getState as () => Dict)()));
	const view: Dict = {};

	for (const key of Object.keys(src)) {
		const value = src[key];
		if (stateKeys.has(key)) {
			view[key] = toNg(() => (src[key] as () => unknown)(), destroyRef);
		} else if (key === "pick") {
			view[key] = (path: string) =>
				toNg(() => (value as (key: string) => () => unknown)(path)(), destroyRef);
		} else if (key === "select") {
			view[key] = (
				selector: (state: unknown) => unknown,
				options?: { equal?: (a: unknown, b: unknown) => boolean },
			) =>
				toNg(
					() =>
						(
							value as (
								selector: (state: unknown) => unknown,
								options?: { equal?: (a: unknown, b: unknown) => boolean },
							) => () => unknown
						)(selector, options)(),
					destroyRef,
				);
		} else if (isResource(value)) {
			const r = value as Dict;
			view[key] = {
				data: toNg(r.data as () => unknown, destroyRef),
				loading: toNg(r.loading as () => unknown, destroyRef),
				error: toNg(r.error as () => unknown, destroyRef),
				status: toNg(r.status as () => unknown, destroyRef),
				refetch: r.refetch,
				clear: r.clear,
			};
		} else if (isMutation(value)) {
			const fn = value as Dict & ((input: unknown) => unknown);
			const m = ((input: unknown) => fn(input)) as Dict & ((input: unknown) => unknown);
			m.loading = toNg(fn.loading as () => unknown, destroyRef);
			m.error = toNg(fn.error as () => unknown, destroyRef);
			m.status = toNg(fn.status as () => unknown, destroyRef);
			m.reset = fn.reset;
			view[key] = m;
		} else {
			view[key] = value; // action or meta method (snapshot/getState/subscribe)
		}
	}

	return view as unknown as Store<T>;
}
