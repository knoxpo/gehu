import { createStore } from "@gehu-js/core";

export const counterStore = createStore(
	({ set, get, ctx }) => ({
		count: 0,
		double: () => get().count * 2,
		inc: () => set((s) => ({ count: s.count + 1 })),
		dec: () => set((s) => ({ count: s.count - 1 })),
		reset: () => ctx.reset(),
	}),
	{ name: "counter", devtools: true },
);
