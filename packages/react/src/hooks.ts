"use client";
import {
	defaultAdapter,
	type SignalLike,
	type StateOf,
	type Store,
	type StoreMutation,
	type StoreResource,
} from "@gehu-js/core";
import { useCallback, useMemo, useRef, useSyncExternalStore } from "react";
import { useInstance } from "./context.js";

const META = new Set(["select", "pick", "subscribe", "snapshot", "getState"]);

/** Selector view: state values + actions/resources/mutations (Zustand-like). */
export type StoreView<T> = StateOf<T> &
	Omit<Store<T>, keyof StateOf<T> | "select" | "pick" | "subscribe" | "snapshot" | "getState">;

function collectMembers(inst: Store<unknown>): Record<string, unknown> {
	const stateKeys = new Set(Object.keys((inst.getState as () => object)()));
	const out: Record<string, unknown> = {};
	for (const key of Object.keys(inst as object)) {
		if (stateKeys.has(key) || META.has(key)) continue;
		out[key] = (inst as Record<string, unknown>)[key];
	}
	return out;
}

/**
 * Subscribe a component to a store with a selector over the merged view
 * `{ ...state values, ...actions/resources }`. Fine-grained: re-renders only
 * when the selected value changes (by `isEqual`, default `Object.is`).
 */
export function useStore<T extends object>(store: Store<T>): StoreView<T>;
export function useStore<T extends object, R>(
	store: Store<T>,
	selector: (view: StoreView<T>) => R,
	isEqual?: (a: R, b: R) => boolean,
): R;
export function useStore<T extends object, R>(
	store: Store<T>,
	selector?: (view: StoreView<T>) => R,
	isEqual: (a: R, b: R) => boolean = Object.is,
): R {
	const inst = useInstance(store);
	const selectorRef = useRef(selector);
	selectorRef.current = selector;
	const isEqualRef = useRef(isEqual);
	isEqualRef.current = isEqual;
	const members = useMemo(() => collectMembers(inst as Store<unknown>), [inst]);
	const cache = useRef<{ has: boolean; value: unknown }>({ has: false, value: undefined });

	const getSelection = useCallback((): R => {
		const view = { ...(inst.getState() as object), ...members } as StoreView<T>;
		const sel = selectorRef.current;
		const next = (sel ? sel(view) : view) as R;
		const c = cache.current;
		if (c.has && isEqualRef.current(c.value as R, next)) return c.value as R;
		c.has = true;
		c.value = next;
		return next;
	}, [inst, members]);

	const subscribe = useCallback((onChange: () => void) => inst.subscribe(() => onChange()), [inst]);
	return useSyncExternalStore(subscribe, getSelection, getSelection);
}

/** Bind a store to a Zustand-style hook: `const useThing = createStoreHook(store)`. */
export function createStoreHook<T extends object>(store: Store<T>) {
	return function useBoundStore<R = StoreView<T>>(
		selector?: (view: StoreView<T>) => R,
		isEqual: (a: R, b: R) => boolean = Object.is,
	): R {
		return useStore(store, selector ?? ((view) => view as unknown as R), isEqual);
	};
}

/**
 * Jotai-atomic read of ANY core signal — a per-key accessor (`store.count`), a
 * derived `store.select(...)`/`store.pick(...)`, or a resource/mutation signal.
 * Re-renders only when that one signal changes.
 */
export function useSignal<V>(
	signal: SignalLike<V>,
	isEqual: (a: V, b: V) => boolean = Object.is,
): V {
	const isEqualRef = useRef(isEqual);
	isEqualRef.current = isEqual;
	const cache = useRef<{ has: boolean; value: V | undefined }>({ has: false, value: undefined });

	const subscribe = useCallback(
		(onChange: () => void) => {
			let first = true;
			return defaultAdapter.effect(() => {
				signal(); // track this exact signal
				if (first) {
					first = false;
					return;
				}
				onChange();
			});
		},
		[signal],
	);
	const getSnapshot = useCallback((): V => {
		const next = signal();
		const c = cache.current;
		if (c.has && isEqualRef.current(c.value as V, next)) return c.value as V;
		c.has = true;
		c.value = next;
		return next;
	}, [signal]);
	return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

/** The resolved store instance (stable) for calling actions / reaching members. */
export function useStoreApi<T extends object>(store: Store<T>): Store<T> {
	return useInstance(store);
}

/** Reactive view of a resource. */
export function useResource<Data>(resource: StoreResource<Data>) {
	return {
		data: useSignal(resource.data),
		loading: useSignal(resource.loading),
		error: useSignal(resource.error),
		status: useSignal(resource.status),
		refetch: resource.refetch,
		clear: resource.clear,
	};
}

/** Reactive view of a mutation + the callable `mutate`. */
export function useMutation<Input, Output>(mutation: StoreMutation<Input, Output>) {
	return {
		mutate: mutation,
		loading: useSignal(mutation.loading),
		error: useSignal(mutation.error),
		status: useSignal(mutation.status),
		reset: mutation.reset,
	};
}
