// Server-safe entry (no "use client"). Import from Next/Remix server components
// to dehydrate stores without crossing the client boundary.
export { dehydrate } from "./hydration.js";
export { GehuRegistry } from "./registry.js";
