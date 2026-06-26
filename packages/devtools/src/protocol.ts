// Devtools event protocol (md §15). Bridge only — no UI.
import type { StoreEventType } from "@gehu-js/core";

export type DevtoolsEventType = StoreEventType | "store.created" | "store.destroyed";

export type DevtoolsEvent = {
	type: DevtoolsEventType;
	store: string;
	at: number;
	target?: string;
	payload?: unknown;
	error?: unknown;
};
