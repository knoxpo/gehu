// Static resource/mutation mocks (md §16). No real async; signals are constants.
import type { ResourceStatus, StoreMutation, StoreResource } from "@gehu/core";

export type MockResourceOptions<T> = {
	data?: T;
	status?: ResourceStatus;
	loading?: boolean;
	error?: unknown;
};

export function mockResource<T>(
	options: MockResourceOptions<T> = {},
): StoreResource<T> {
	const status =
		options.status ?? (options.data !== undefined ? "success" : "idle");
	return {
		data: () => options.data,
		loading: () => options.loading ?? status === "loading",
		error: () => options.error ?? null,
		status: () => status,
		refetch: async () => options.data as T,
		clear: () => {},
	};
}

export type MockMutationOptions<O> = {
	output?: O;
	error?: unknown;
	status?: ResourceStatus;
};

/** A callable mutation mock that records its inputs in `.calls`. */
export type MockMutation<I, O> = StoreMutation<I, O> & { calls: I[] };

export function mockMutation<I, O>(
	options: MockMutationOptions<O> = {},
): MockMutation<I, O> {
	const calls: I[] = [];
	const fn = (async (input: I): Promise<O | undefined> => {
		calls.push(input);
		if (options.error) throw options.error;
		return options.output;
	}) as MockMutation<I, O>;
	fn.loading = () => false;
	fn.error = () => options.error ?? null;
	fn.status = () => options.status ?? "idle";
	fn.reset = () => {};
	fn.calls = calls;
	return fn;
}
