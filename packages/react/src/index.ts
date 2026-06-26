"use client";
// @gehu-js/react — React adapter (CSR + SSR). Bridges the core store to React
// via useSyncExternalStore. Zustand-simple + Jotai-atomic.
export { shallowEqual as shallow } from "@gehu-js/core";
export type { GehuProviderProps } from "./context.js";
export { GehuProvider, useInstance } from "./context.js";
export type { StoreView } from "./hooks.js";
export {
	createStoreHook,
	useMutation,
	useResource,
	useSignal,
	useStore,
	useStoreApi,
} from "./hooks.js";
export { dehydrate } from "./hydration.js";
export { GehuRegistry } from "./registry.js";
