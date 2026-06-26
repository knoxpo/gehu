// Runtime brands for resources/mutations. The buildStore split uses these to
// expose them on the store as-is — never cloned into state, never signal-wrapped.
export const RESOURCE = Symbol("gehu.resource");
export const MUTATION = Symbol("gehu.mutation");
// Re-instantiation recipe attached to a store, so adapters (e.g. Angular) can
// rebuild fresh, isolated instances from the same definition.
export const STORE_DEF = Symbol("gehu.storeDef");
// Per-store event emitter, attached so linkedStore can emit after build.
export const EMITTER = Symbol("gehu.emitter");
// Internal state writer, used by adapters/compat layers that need to patch
// state without re-implementing the store engine.
export const STORE_SET = Symbol("gehu.storeSet");

export function brand<T extends object>(obj: T, sym: symbol): T {
	Object.defineProperty(obj, sym, { value: true, enumerable: false });
	return obj;
}

/** True for a branded resource object. (Mutations are functions, caught earlier.) */
export function isBranded(v: unknown): boolean {
	return (
		v != null &&
		(typeof v === "object" || typeof v === "function") &&
		((v as Record<symbol, unknown>)[RESOURCE] === true ||
			(v as Record<symbol, unknown>)[MUTATION] === true)
	);
}

export function isResource(v: unknown): boolean {
	return (
		typeof v === "object" &&
		v !== null &&
		(v as unknown as Record<symbol, unknown>)[RESOURCE] === true
	);
}

export function isMutation(v: unknown): boolean {
	return typeof v === "function" && (v as unknown as Record<symbol, unknown>)[MUTATION] === true;
}
