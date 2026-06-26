// structuredClone with JSON fallback (md §10 allowed APIs). State is data-only
// (functions are split out before cloning), so neither path hits a function.
export function clone<T>(value: T): T {
	if (typeof structuredClone === "function") {
		return structuredClone(value);
	}
	return JSON.parse(JSON.stringify(value)) as T;
}
