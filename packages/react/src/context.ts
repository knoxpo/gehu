"use client";
import type { Store } from "@gehu-js/core";
import { createContext, createElement, type ReactNode, useContext, useState } from "react";
import { GehuRegistry } from "./registry.js";

const GehuContext = createContext<GehuRegistry | null>(null);

export type GehuProviderProps = {
	/** name → snapshot, from dehydrate() on the server (optional). */
	hydrate?: Record<string, unknown>;
	children: ReactNode;
};

/**
 * Provides a per-request store registry. Each mount (= each SSR request) gets
 * isolated instances seeded from `hydrate`. Without a provider, hooks fall back
 * to the module-level singleton (pure CSR).
 */
export function GehuProvider({ hydrate, children }: GehuProviderProps) {
	const [registry] = useState(() => new GehuRegistry(hydrate ?? null));
	return createElement(GehuContext.Provider, { value: registry }, children);
}

/** Resolve the active instance for a store: provider's, or the singleton. */
export function useInstance<T extends object>(store: Store<T>): Store<T> {
	const registry = useContext(GehuContext);
	return registry ? registry.getOrCreate(store) : store;
}
