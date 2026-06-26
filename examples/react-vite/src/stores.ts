import { createStore } from "@gehu-js/core";

export const counterStore = createStore(
	({ set, get, ctx }) => ({
		count: 0,
		double: () => get().count * 2,
		inc: () => set((s) => ({ count: s.count + 1 })),
		dec: () => set((s) => ({ count: s.count - 1 })),
		reset: () => ctx.reset(),
	}),
	{ name: "counter" },
);

export type User = { id: string; name: string };

export const userStore = createStore(
	({ set, get, ctx }) => ({
		selectedId: null as string | null,
		user: ctx.resource<User>({
			name: "user",
			autoRun: true,
			enabled: () => !!get().selectedId,
			key: () => ["user", get().selectedId],
			fetch: async () => {
				await new Promise((r) => setTimeout(r, 300));
				const id = get().selectedId as string;
				return { id, name: id === "1" ? "Alex" : "Sam" };
			},
		}),
		select: (id: string) => set({ selectedId: id }),
	}),
	{ name: "user" },
);
