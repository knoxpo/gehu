// ctx.mutation — async writes (md §8). Swallows errors by default (resolve
// undefined); set errorSwallow:false to rethrow.
import { brand, MUTATION } from "./brand.js";
import type {
	Emitter,
	MutationOptions,
	ResourceStatus,
	SignalAdapter,
	StoreMutation,
} from "./types.js";

export function createMutation<Input, Output>(
	adapter: SignalAdapter,
	options: MutationOptions<Input, Output>,
	emit?: Emitter["emit"],
): StoreMutation<Input, Output> {
	const status = adapter.signal<ResourceStatus>("idle");
	const error = adapter.signal<unknown>(null);
	const loading = adapter.computed(() => status() === "loading");
	const swallow = options.errorSwallow ?? true;
	const target = options.name;

	const fn = async (input: Input): Promise<Output | undefined> => {
		status.set("loading");
		error.set(null);
		emit?.({ type: "mutation.started", target, payload: input });
		const rollback = options.optimistic ? options.optimistic(input) : undefined;
		const max = options.retry ?? 0;
		let attempt = 0;

		try {
			for (;;) {
				try {
					const output = await options.run(input);
					options.onSuccess?.(output);
					status.set("success");
					emit?.({ type: "mutation.success", target, payload: output });
					return output;
				} catch (err) {
					if (attempt++ < max) continue;
					throw err;
				}
			}
		} catch (err) {
			if (rollback) rollback();
			error.set(err);
			status.set("error");
			emit?.({ type: "mutation.error", target, error: err });
			options.onError?.(err);
			if (!swallow) throw err;
			return undefined;
		} finally {
			options.onSettled?.();
		}
	};

	const mutation = fn as StoreMutation<Input, Output>;
	mutation.loading = loading;
	mutation.error = error;
	mutation.status = status;
	mutation.reset = (): void => {
		status.set("idle");
		error.set(null);
	};
	return brand(mutation, MUTATION);
}
