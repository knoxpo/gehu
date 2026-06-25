// @gehu/testing — framework- and runner-agnostic store testing (md §16).
// Imports only @gehu/core: no Jest/Vitest/Mocha, no Angular.
export { createTestStore, createLinkedTestStore } from './createTestStore.js';
export type { TestStore, TestStoreOptions } from './createTestStore.js';
export { mockResource, mockMutation } from './mocks.js';
export type { MockResourceOptions, MockMutationOptions, MockMutation } from './mocks.js';
export { flushEffects, flushResources } from './flush.js';
export { captureActions, capturePatches } from './capture.js';
export type { ActionCapture, PatchCapture } from './capture.js';
