// Deterministic flushing for tests (md §16).
import { flushSync } from "@gehu-js/core";

/** Run pending core effects synchronously (subscriptions, autoRun triggers). */
export const flushEffects = flushSync;

/** Flush effects, then let pending resource fetches (real promises) settle. */
export async function flushResources(): Promise<void> {
	flushSync();
	await new Promise<void>((resolve) => setTimeout(resolve, 0));
	flushSync();
}
