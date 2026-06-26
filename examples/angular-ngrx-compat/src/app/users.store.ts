import { computed } from "@angular/core";
import { signalStore, withState, withComputed, withMethods, patchState } from "@gehu/angular/ngrx-compat";

export interface User {
	id: number;
	name: string;
	email: string;
}

interface UsersState {
	users: User[];
	loading: boolean;
	error: string | null;
	lastFetchTime: number | null;
}

const initialState: UsersState = {
	users: [],
	loading: false,
	error: null,
	lastFetchTime: null,
};

export const UsersStore = signalStore(
	withState(initialState),
	withComputed(({ users, loading, error }) => ({
		userCount: computed(() => users().length),
		hasError: computed(() => error() !== null),
		isEmpty: computed(() => users().length === 0 && !loading()),
	})),
	withMethods((store) => ({
		async fetchUsers() {
			// Check cache (simple strategy: don't refetch within 30s)
			if (store.lastFetchTime() && Date.now() - store.lastFetchTime()! < 30000) {
				return;
			}

			patchState(store, { loading: true, error: null });
			try {
				const response = await fetch("https://jsonplaceholder.typicode.com/users");
				if (!response.ok) throw new Error(`HTTP ${response.status}`);
				const users = await response.json();
				patchState(store, {
					users: users.slice(0, 5), // Limit to 5 users
					loading: false,
					lastFetchTime: Date.now(),
				});
			} catch (err) {
				patchState(store, {
					error: err instanceof Error ? err.message : "Unknown error",
					loading: false,
				});
			}
		},

		clearError() {
			patchState(store, { error: null });
		},

		reset() {
			patchState(store, initialState);
		},
	})),
);
