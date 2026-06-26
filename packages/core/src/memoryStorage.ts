// Pure in-memory StorageAdapter (md §14). No browser API → SSR-safe; usable by
// anyone (tests, server, custom plugins).
import type { StorageAdapter } from "./types.js";

export function memoryStorage(): StorageAdapter {
	const map = new Map<string, string>();
	return {
		getItem: (key) => map.get(key) ?? null,
		setItem: (key, value) => void map.set(key, value),
		removeItem: (key) => void map.delete(key),
	};
}
