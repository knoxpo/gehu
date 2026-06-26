// Public + internal types (md §5, §6, §11).

// Phantom brand used to recognise resources at the type level (so the store
// exposes them as-is instead of signal-wrapping). Runtime brand lives in brand.ts.
declare const RESOURCE_BRAND: unique symbol;

export type CleanupFn = () => void;

export type SignalLike<T> = () => T;

export type WritableSignalLike<T> = SignalLike<T> & {
	set(value: T): void;
	update(fn: (value: T) => T): void;
};

export type SignalAdapter = {
	signal<T>(value: T): WritableSignalLike<T>;
	computed<T>(fn: () => T): SignalLike<T>;
	effect(fn: () => void): CleanupFn;
};

// --- storage + plugins (md §14; plugin system per Phase 4 decision) ---

/** Sync string KV (localStorage shape). Keeps core storage-agnostic. */
export type StorageAdapter = {
	getItem(key: string): string | null;
	setItem(key: string, value: string): void;
	removeItem(key: string): void;
};

// --- events (md §15) ---
export type StoreEventType =
	| "state.changed"
	| "action.started"
	| "action.completed"
	| "action.failed"
	| "resource.loading"
	| "resource.success"
	| "resource.error"
	| "mutation.started"
	| "mutation.success"
	| "mutation.error"
	| "linkedStore.connected";

export type StoreEvent = {
	type: StoreEventType;
	target?: string; // action / resource / mutation name
	payload?: unknown;
	error?: unknown;
};

export type Emitter = {
	emit(event: StoreEvent): void;
	subscribe(fn: (event: StoreEvent) => void): CleanupFn;
	size(): number;
};

/** What a plugin receives once the store is built. */
export type PluginApi<T extends object = object> = {
	config: StoreConfig;
	store: Store<T>;
	getState(): StateOf<T>;
	setState(partial: Partial<StateOf<T>>): void;
	subscribe: Store<T>["subscribe"];
	snapshot(): StateOf<T>;
	onEvent(fn: (event: StoreEvent) => void): CleanupFn;
};

/** A store extension. Persistence is the first one; community can add more. */
export type StorePlugin<T extends object = object> = {
	name: string;
	init(api: PluginApi<T>): undefined | CleanupFn;
};

// --- store config (md §5, §14) ---
export type PersistConfig = {
	key?: string;
	select?: (state: unknown) => unknown;
	storage?: "local" | "session" | "memory" | StorageAdapter;
	version?: number;
	migrate?: (old: unknown, oldVersion: number) => unknown;
	serialize?: (value: unknown) => string;
	deserialize?: (raw: string) => unknown;
	// factory defaults < persisted < hydrate (default 'hydrate'), or flip to
	// 'persisted' so stored state always wins.
	hydratePrecedence?: "hydrate" | "persisted";
};

export type StoreConfig = {
	name?: string;
	devtools?: boolean;
	persist?: boolean | PersistConfig;
	trace?: boolean;
	logger?: boolean;
	hydrate?: unknown;
	plugins?: StorePlugin[];
	// Internal: swaps the reactive backend (e.g. Angular signals). Defaults to the
	// core signal adapter. Used by @gehu-js/angular to build per-injector instances.
	adapter?: SignalAdapter;
};

// --- resources (md §7) ---
export type ResourceStatus = "idle" | "loading" | "success" | "error";

export type ResourceOptions<Data> = {
	name?: string;
	key?: () => readonly unknown[];
	enabled?: () => boolean;
	// A no-arg `() => Promise<Data>` is assignable here, so md's examples still
	// type-check; authors that want abort can read the signal.
	fetch: (ctx: { signal: AbortSignal }) => Promise<Data>;
	autoRun?: boolean; // default false (manual); true → reactive auto-fetch
	retry?: number;
};

export type StoreResource<Data> = {
	readonly [RESOURCE_BRAND]?: true;
	data: SignalLike<Data | undefined>;
	loading: SignalLike<boolean>;
	error: SignalLike<unknown>;
	status: SignalLike<ResourceStatus>;
	refetch(): Promise<Data>;
	clear(): void;
};

// --- mutations (md §8) ---
export type MutationOptions<Input, Output> = {
	name?: string;
	run: (input: Input) => Promise<Output>;
	onSuccess?: (output: Output) => void;
	onError?: (error: unknown) => void;
	onSettled?: () => void;
	optimistic?: (input: Input) => (() => void) | undefined; // returns a rollback fn
	errorSwallow?: boolean; // default true (resolve undefined); false → rethrow
	retry?: number;
};

export type StoreMutation<Input, Output> = ((input: Input) => Promise<Output | undefined>) & {
	loading: SignalLike<boolean>;
	error: SignalLike<unknown>;
	status: SignalLike<ResourceStatus>;
	reset(): void;
};

// --- ctx (md §6) ---
export type StoreContext<T> = {
	reset(): void;
	snapshot(): StateOf<T>;
	effect(name: string, fn: () => void): CleanupFn;
	resource<Data>(options: ResourceOptions<Data>): StoreResource<Data>;
	mutation<Input, Output>(options: MutationOptions<Input, Output>): StoreMutation<Input, Output>;
};

// --- store shape helpers (md §3–4) ---
type IsFn<V> = V extends (...args: never[]) => unknown ? true : false;
type IsResource<V> = V extends StoreResource<unknown> ? true : false;
type IsArray<V> = V extends readonly unknown[] ? true : false;
type IsObjectPathable<V> = V extends object
	? IsFn<V> extends true
		? false
		: IsArray<V> extends true
			? false
			: true
	: false;

/** State-only view: drop functions (actions/mutations) and resources. */
export type StateOf<T> = {
	[K in keyof T as IsFn<T[K]> extends true
		? never
		: IsResource<T[K]> extends true
			? never
			: K]: T[K];
};

export type StatePath<T> = T extends object
	? {
			[K in keyof T & string]: IsObjectPathable<T[K]> extends true
				? K | `${K}.${StatePath<T[K]>}`
				: K;
		}[keyof T & string]
	: never;

export type PathValue<T, P extends string> = P extends `${infer K}.${infer Rest}`
	? K extends keyof T
		? PathValue<T[K], Rest>
		: never
	: P extends keyof T
		? T[P]
		: never;

export type SelectorOptions<Result> = {
	equal?: (a: Result, b: Result) => boolean;
};

export type SubscribeOptions = {
	fireImmediately?: boolean;
};

export type SelectorSubscribeOptions<Result> = SelectorOptions<Result> & SubscribeOptions;

export type Setter<T> = (
	partial: Partial<StateOf<T>> | ((state: T) => Partial<StateOf<T>>),
) => void;

export type StoreApi<T> = {
	set: Setter<T>;
	get: () => T;
	ctx: StoreContext<T>;
};

/** Strict factory: full type safety inside the body. Used when T is annotated. */
export type Factory<T> = (api: StoreApi<T>) => T;

/**
 * Loose api: `set`/`get`/`ctx` are untyped. Breaks the self-reference cycle so
 * T can be inferred purely from the returned structure when no type is given.
 * The resulting Store<T> is still fully typed at the use site.
 */
export type LooseApi = {
	// The function arm gives the `s` in `set(s => ...)` a contextual `any`, so it
	// needs no annotation and doesn't trip noImplicitAny.
	// biome-ignore lint/suspicious/noExplicitAny: inference helper needs a loose callback state type
	set: (partial: object | ((state: any) => object)) => void;
	// biome-ignore lint/suspicious/noExplicitAny: inference helper needs a loose return type
	get: () => any;
	// biome-ignore lint/suspicious/noExplicitAny: inference helper needs a loose context type
	ctx: StoreContext<any>;
};

export type InferFactory<T> = (api: LooseApi) => T;

/**
 * Exposed store handle: state keys become signal accessors, action functions
 * stay as-is (md examples `cart.items()` + `cart.addItem(x)`).
 */
export type Store<T> = {
	// Resources and functions (actions/mutations) stay as-is; plain state becomes
	// a signal accessor.
	[K in keyof T]: IsResource<T[K]> extends true
		? T[K]
		: IsFn<T[K]> extends true
			? T[K]
			: SignalLike<T[K]>;
} & {
	select<Result>(
		selector: (state: StateOf<T>) => Result,
		options?: SelectorOptions<Result>,
	): SignalLike<Result>;
	pick<P extends StatePath<StateOf<T>>>(path: P): SignalLike<PathValue<StateOf<T>, P>>;
	subscribe(listener: (state: StateOf<T>) => void, options?: SubscribeOptions): CleanupFn;
	subscribe<Result>(
		selector: (state: StateOf<T>) => Result,
		listener: (value: Result, prev: Result) => void,
		options?: SelectorSubscribeOptions<Result>,
	): CleanupFn;
	snapshot(): StateOf<T>;
	getState(): StateOf<T>;
};

// --- linked stores (md §9) ---
export type LinkedApi<S, T> = StoreApi<T> & { stores: S };
export type LinkedFactory<S, T> = (api: LinkedApi<S, T>) => T;
export type InferLinkedFactory<S, T> = (api: LooseApi & { stores: S }) => T;
