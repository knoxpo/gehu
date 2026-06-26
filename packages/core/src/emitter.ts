// Tiny per-store event emitter (Phase 6). Lets plugins observe lifecycle events
// without core knowing about them. `emit` is a no-op when nobody's listening, so
// non-devtools stores pay essentially nothing.
import type { CleanupFn, Emitter, StoreEvent } from "./types.js";

export function createEmitter(): Emitter {
	const listeners = new Set<(event: StoreEvent) => void>();
	return {
		emit: (event: StoreEvent): void => {
			if (listeners.size === 0) return;
			for (const fn of [...listeners]) fn(event);
		},
		subscribe: (fn: (event: StoreEvent) => void): CleanupFn => {
			listeners.add(fn);
			return () => listeners.delete(fn);
		},
		size: () => listeners.size,
	};
}
