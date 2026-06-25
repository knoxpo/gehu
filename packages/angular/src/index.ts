// @gehu/angular — Angular adapter (md §12, §13, §16).
// API renamed from md's stale `provideVeducx` → `provideGehu`.
export { angularSignalAdapter } from './adapter.js';
export { provideGehu, provideStore, provideGehuTesting, provideMockStore } from './provide.js';
export { injectStore } from './inject.js';
export type { InjectStoreOptions } from './inject.js';
export { bridgeStore } from './bridge.js';
export { dehydrate } from './hydration.js';
export { GEHU_CONFIG, GEHU_HYDRATION, type GehuConfig } from './tokens.js';
export { GEHU_REGISTRY, GehuRegistry } from './registry.js';
