// In-process event bridge + optional global hook for a browser extension.
// No UI is shipped here.
import type { CleanupFn, Store } from "@gehu-js/core";
import type { DevtoolsEvent } from "./protocol.js";

type GlobalHook = { send?: (event: DevtoolsEvent) => void };

export class DevtoolsBus {
	private listeners = new Set<(event: DevtoolsEvent) => void>();
	private stores = new Map<string, Store<unknown>>();
	/** name → linked sub-store names (md §15 linked-store graph). */
	graph: Record<string, string[]> = {};

	subscribe(fn: (event: DevtoolsEvent) => void): CleanupFn {
		this.listeners.add(fn);
		return () => this.listeners.delete(fn);
	}

	emit(event: DevtoolsEvent): void {
		for (const fn of [...this.listeners]) fn(event);
		// Forward to a browser extension if one attached a global hook.
		const hook = (globalThis as Record<string, unknown>).__GEHU_DEVTOOLS__ as
			| GlobalHook
			| undefined;
		hook?.send?.(event);
	}

	register(name: string, store: Store<unknown>): void {
		this.stores.set(name, store);
	}

	unregister(name: string): void {
		this.stores.delete(name);
	}

	exportSnapshots(): Record<string, unknown> {
		const out: Record<string, unknown> = {};
		for (const [name, store] of this.stores) out[name] = store.snapshot();
		return out;
	}
}

export const devtoolsBus = new DevtoolsBus();
