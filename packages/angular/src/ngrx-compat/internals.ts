import {
	computed,
	DestroyRef,
	inject,
	isSignal,
	type Signal,
	type Type,
	ɵɵdefineInjectable,
} from "@angular/core";
import type {
	CleanupFn,
	SignalLike,
	Store,
	StoreConfig,
	StorePlugin,
} from "@gehu/core";
import { buildStore } from "@gehu/core";
import { angularSignalAdapter } from "../adapter.js";

const FEATURE = Symbol("gehu.ngrxCompatFeature");
const COMPAT_DEF = Symbol("gehu.ngrxCompatDef");
const COMPAT_SET = Symbol("gehu.ngrxCompatSet");
declare const COMPAT_STATE: unique symbol;

type Dict = Record<string, unknown>;

type CompatMembers<
	State extends object,
	Props extends object,
	Methods extends object,
> = {
	[K in keyof State]: Signal<State[K]>;
} & Props &
	Methods & {
		readonly [COMPAT_STATE]?: State;
		snapshot(): State;
		getState(): State;
		subscribe(listener: (state: State) => void): CleanupFn;
	};

type StateSignals<State extends object> = {
	[K in keyof State]: Signal<State[K]>;
};
type ComputedResult<
	DictT extends Record<string, SignalLike<unknown> | (() => unknown)>,
> = {
	[K in keyof DictT]: DictT[K] extends Signal<infer V>
		? Signal<V>
		: DictT[K] extends () => infer V
			? Signal<V>
			: never;
};
type UnionToIntersection<U> = (
	U extends unknown
		? (arg: U) => void
		: never
) extends (arg: infer I) => void
	? I
	: never;
type Prettify<T> = { [K in keyof T]: T[K] } & {};
type FeatureState<F> =
	F extends SignalStoreFeature<infer State extends object, object>
		? State
		: never;
type FeatureView<F> =
	F extends SignalStoreFeature<object, infer View extends object>
		? View
		: never;
type MergeFeatureState<
	Features extends readonly SignalStoreFeature<object, object>[],
> = Prettify<UnionToIntersection<FeatureState<Features[number]>>>;
type MergeFeatureViews<
	Features extends readonly SignalStoreFeature<object, object>[],
> = Prettify<UnionToIntersection<FeatureView<Features[number]>>>;

type CompatHooks = {
	onInit?: () => void;
	onDestroy?: () => void;
};

type CompatFeatureKind = "state" | "props" | "computed" | "methods" | "hooks";
type EmptyObject = Record<never, never>;

type FeatureBase<
	Kind extends CompatFeatureKind,
	Value,
	State extends object,
	View extends object,
> = {
	readonly [FEATURE]: true;
	readonly kind: Kind;
	readonly value: Value;
	readonly __state?: State;
	readonly __view?: View;
};

export type SignalStoreFeature<
	State extends object = object,
	View extends object = object,
> =
	| FeatureBase<"state", object | (() => object), State, View>
	// biome-ignore lint/suspicious/noExplicitAny: compat feature factory needs a loose store parameter for inference
	| FeatureBase<"props", object | ((store: any) => object), State, View>
	| FeatureBase<
			"computed",
			// biome-ignore lint/suspicious/noExplicitAny: compat feature factory needs a loose store parameter for inference
			(store: any) => Record<string, SignalLike<unknown> | (() => unknown)>,
			State,
			View
	  >
	// biome-ignore lint/suspicious/noExplicitAny: compat feature factory needs a loose store parameter for inference
	| FeatureBase<"methods", (store: any) => object, State, View>
	| FeatureBase<
			"hooks",
			// biome-ignore lint/suspicious/noExplicitAny: compat feature factory needs a loose store parameter for inference
			CompatHooks | ((store: any) => CompatHooks | undefined),
			State,
			View
	  >;

export type SignalStoreConfig = Pick<
	StoreConfig,
	"name" | "devtools" | "persist" | "trace" | "logger" | "hydrate" | "plugins"
> & {
	providedIn?: "root" | "platform" | "any" | null;
};

type CompatStoreDef = {
	config: SignalStoreConfig;
	features: SignalStoreFeature<object, object>[];
};

export type CompatStoreToken<T extends object> = Type<T> & {
	readonly [COMPAT_DEF]: CompatStoreDef;
};

function feature<
	Kind extends CompatFeatureKind,
	Value,
	State extends object,
	View extends object,
>(kind: Kind, value: Value): FeatureBase<Kind, Value, State, View> {
	return { [FEATURE]: true, kind, value } as FeatureBase<
		Kind,
		Value,
		State,
		View
	>;
}

function isFeature(
	value: unknown,
): value is SignalStoreFeature<object, object> {
	return !!value && typeof value === "object" && FEATURE in value;
}

function isCompatToken<T extends object>(
	value: unknown,
): value is CompatStoreToken<T> {
	return (
		!!value &&
		(typeof value === "function" || typeof value === "object") &&
		COMPAT_DEF in value
	);
}

function copyOwnKeys(target: object, source: object): void {
	for (const key of Reflect.ownKeys(source)) {
		const desc = Object.getOwnPropertyDescriptor(source, key);
		if (desc) Object.defineProperty(target, key, desc);
	}
}

function getCompatSetter(
	store: object,
): (partial: object | ((state: object) => object)) => void {
	for (const key of Object.getOwnPropertySymbols(store)) {
		const value = (store as Record<symbol, unknown>)[key];
		if (typeof value === "function") {
			return value as (partial: object | ((state: object) => object)) => void;
		}
	}
	throw new Error(
		"Compat store could not find the underlying Gehu state setter",
	);
}

function createView(
	baseStore: Store<object>,
	def: CompatStoreDef,
): CompatMembers<object, object, object> {
	const view = {} as Dict;
	copyOwnKeys(view, baseStore as object);
	Object.defineProperty(view, COMPAT_SET, {
		value: getCompatSetter(baseStore as object),
		enumerable: false,
	});

	for (const current of def.features) {
		if (current.kind === "state") continue;
		if (current.kind === "props") {
			const props =
				typeof current.value === "function"
					? (current.value as (store: Dict) => Dict)(view)
					: current.value;
			Object.assign(view, props);
			continue;
		}
		if (current.kind === "computed") {
			const entries = current.value(view);
			for (const [key, signalOrFn] of Object.entries(entries)) {
				view[key] = isSignal(signalOrFn) ? signalOrFn : computed(signalOrFn);
			}
			continue;
		}
		if (current.kind === "methods") {
			Object.assign(view, current.value(view));
			continue;
		}
		const hooks =
			typeof current.value === "function"
				? (current.value as (store: Dict) => CompatHooks | undefined)(view)
				: current.value;
		if (hooks?.onInit) hooks.onInit();
		if (hooks?.onDestroy) inject(DestroyRef).onDestroy(hooks.onDestroy);
	}

	return view as CompatMembers<object, object, object>;
}

function buildState(def: CompatStoreDef): object {
	const merged: Dict = {};
	for (const current of def.features) {
		if (current.kind !== "state") continue;
		const chunk =
			typeof current.value === "function" ? current.value() : current.value;
		Object.assign(merged, chunk);
	}
	return merged;
}

export function createCompatStore<T extends object>(
	def: CompatStoreDef,
	hydrate: unknown = def.config.hydrate,
): T {
	const config: StoreConfig = {
		name: def.config.name,
		devtools: def.config.devtools,
		persist: def.config.persist,
		trace: def.config.trace,
		logger: def.config.logger,
		hydrate,
		plugins: def.config.plugins as StorePlugin[] | undefined,
		adapter: angularSignalAdapter,
	};
	const baseStore = buildStore<object>(() => buildState(def), config);
	return createView(baseStore, def) as unknown as T;
}

export function getCompatDef<T extends object>(
	token: CompatStoreToken<T>,
): CompatStoreDef {
	return token[COMPAT_DEF];
}

export function isCompatStoreToken<T extends object>(
	value: unknown,
): value is CompatStoreToken<T> {
	return isCompatToken(value);
}

export function withState<State extends object>(
	state: State | (() => State),
): SignalStoreFeature<State, StateSignals<State>> {
	return feature("state", state);
}

export function withProps<Props extends object>(
	// biome-ignore lint/suspicious/noExplicitAny: compat factory parameter must stay loose for NgRx-style inference
	props: Props | ((store: any) => Props),
): SignalStoreFeature<EmptyObject, Props> {
	return feature("props", props);
}

export function withComputed<
	Computed extends Record<string, SignalLike<unknown> | (() => unknown)>,
>(
	// biome-ignore lint/suspicious/noExplicitAny: compat factory parameter must stay loose for NgRx-style inference
	factory: (store: any) => Computed,
): SignalStoreFeature<EmptyObject, ComputedResult<Computed>> {
	return feature("computed", factory);
}

export function withMethods<Methods extends object>(
	// biome-ignore lint/suspicious/noExplicitAny: compat factory parameter must stay loose for NgRx-style inference
	factory: (store: any) => Methods,
): SignalStoreFeature<EmptyObject, Methods> {
	return feature("methods", factory);
}

export function withHooks(
	// biome-ignore lint/suspicious/noExplicitAny: compat factory parameter must stay loose for NgRx-style inference
	hooks: CompatHooks | ((store: any) => CompatHooks | undefined),
): SignalStoreFeature<EmptyObject, EmptyObject> {
	return feature("hooks", hooks);
}

export function patchState<State extends object>(
	store:
		| ({ readonly [COMPAT_STATE]?: State } & Record<PropertyKey, unknown>)
		| {
				readonly [COMPAT_STATE]?: State;
				getState(): State;
		  },
	partial:
		| Partial<NonNullable<(typeof store)[typeof COMPAT_STATE]>>
		| ((
				state: NonNullable<(typeof store)[typeof COMPAT_STATE]>,
		  ) => Partial<NonNullable<(typeof store)[typeof COMPAT_STATE]>>),
): void {
	const set = (store as Record<PropertyKey, unknown>)[COMPAT_SET];
	if (typeof set !== "function")
		throw new Error("patchState expects a Gehu compat store instance");
	set(partial as object | ((state: object) => object));
}

export function signalStore<
	const Features extends readonly SignalStoreFeature<object, object>[],
>(
	...features: Features
): CompatStoreToken<
	CompatMembers<
		MergeFeatureState<Features>,
		MergeFeatureViews<Features>,
		EmptyObject
	>
>;
export function signalStore<
	const Features extends readonly SignalStoreFeature<object, object>[],
>(
	config: SignalStoreConfig,
	...features: Features
): CompatStoreToken<
	CompatMembers<
		MergeFeatureState<Features>,
		MergeFeatureViews<Features>,
		EmptyObject
	>
>;
export function signalStore<
	const Features extends readonly SignalStoreFeature<object, object>[],
>(
	...args: [SignalStoreConfig, ...Features] | Features
): CompatStoreToken<
	CompatMembers<
		MergeFeatureState<Features>,
		MergeFeatureViews<Features>,
		EmptyObject
	>
> {
	const signalStoreArgs = [...args];
	const config = isFeature(signalStoreArgs[0])
		? {}
		: (signalStoreArgs.shift() as SignalStoreConfig);
	const features = signalStoreArgs as SignalStoreFeature<object, object>[];
	const def: CompatStoreDef = { config, features };

	class CompatSignalStore {
		constructor() {
			copyOwnKeys(this, createCompatStore<object>(def));
		}
	}
	// No @Injectable decorator — this class is created at runtime inside
	// signalStore(), so a decorator would force a JIT compile ("JIT compiler
	// unavailable" under AOT). ɵɵdefineInjectable is a plain call that gives the
	// class a provider def, so `providers: [Store]` (a type provider resolved via
	// ɵprov.factory) and `inject(Store)` both work under AOT.
	(CompatSignalStore as { ɵprov?: unknown }).ɵprov = ɵɵdefineInjectable({
		token: CompatSignalStore,
		factory: () => new CompatSignalStore(),
		providedIn: config.providedIn ?? null,
	});

	Object.defineProperty(CompatSignalStore, COMPAT_DEF, {
		value: def,
		enumerable: false,
	});
	return CompatSignalStore as unknown as CompatStoreToken<
		CompatMembers<
			MergeFeatureState<Features>,
			MergeFeatureViews<Features>,
			EmptyObject
		>
	>;
}
