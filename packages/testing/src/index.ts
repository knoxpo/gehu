// @gehu/testing — framework- and runner-agnostic store testing (md §16).
// Imports only @gehu/core: no Jest/Vitest/Mocha, no Angular.

export type { ActionCapture, PatchCapture } from "./capture.js";
export { captureActions, capturePatches } from "./capture.js";
export type { TestStore, TestStoreOptions } from "./createTestStore.js";
export { createLinkedTestStore, createTestStore } from "./createTestStore.js";
export { flushEffects, flushResources } from "./flush.js";
export type {
	MockMutation,
	MockMutationOptions,
	MockResourceOptions,
} from "./mocks.js";
export { mockMutation, mockResource } from "./mocks.js";
