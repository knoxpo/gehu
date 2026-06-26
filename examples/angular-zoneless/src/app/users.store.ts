import { createStore } from "@gehu/core";

export type User = { id: string; name: string };

// Fake async API (no backend needed for the demo).
const DB: Record<string, User> = {
	"1": { id: "1", name: "Alex" },
	"2": { id: "2", name: "Sam" },
};
const getUser = (id: string): Promise<User> =>
	new Promise((resolve) =>
		setTimeout(() => resolve(DB[id] ?? { id, name: "Unknown" }), 400),
	);

export const usersStore = createStore(
	({ set, get, ctx }) => ({
		selectedId: null as string | null,

		// autoRun: re-fetches automatically whenever selectedId changes — and the
		// loading/data signals update the template under zoneless change detection.
		user: ctx.resource<User>({
			name: "user",
			autoRun: true,
			enabled: () => !!get().selectedId,
			key: () => ["user", get().selectedId],
			fetch: () => {
				const selectedId = get().selectedId;
				if (!selectedId) throw new Error("No selected user");
				return getUser(selectedId);
			},
		}),

		select: (id: string) => set({ selectedId: id }),
	}),
	{ name: "users" },
);
