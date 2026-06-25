// Ambient declarations for the two platform globals core uses (md §10 allowed:
// queueMicrotask, structuredClone). Declared here instead of pulling the DOM
// lib, which would also surface forbidden globals (window/document/localStorage).
declare function queueMicrotask(callback: () => void): void;
declare function structuredClone<T>(value: T): T;

// Minimal AbortController/AbortSignal (md §10 allowed) — just what resource.ts
// touches. Avoids pulling the DOM lib.
interface AbortSignal {
  readonly aborted: boolean;
}
interface AbortController {
  readonly signal: AbortSignal;
  abort(): void;
}
declare const AbortController: { new (): AbortController };
