// @gehu/angular — Angular adapter (md §12, §13, §16).
// API renamed from md's stale `provideVeducx` → `provideGehu`.
export { angularSignalAdapter } from "./adapter.js";
export { bridgeStore } from "./bridge.js";
export { dehydrate } from "./hydration.js";
export type { InjectStoreOptions } from "./inject.js";
export { injectStore } from "./inject.js";
export type { CompatStoreToken } from "./ngrx-compat/internals.js";
export {
	provideGehu,
	provideGehuTesting,
	provideMockStore,
	provideStore,
} from "./provide.js";
export { GEHU_REGISTRY, GehuRegistry } from "./registry.js";
export { GEHU_CONFIG, GEHU_HYDRATION, type GehuConfig } from "./tokens.js";
