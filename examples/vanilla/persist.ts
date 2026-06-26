// Phase 4 demo: persistence via the plugin system (md §14), framework-free.
// Run: bun run persist.ts
import { createStore, flushSync, memoryStorage } from "@gehu/core";
import { persist } from "@gehu/persist";

// A shared adapter stands in for localStorage (which Bun/Node lack). In a
// browser you'd use storage: 'local'.
const storage = memoryStorage();

const makeCounter = () =>
	createStore(
		({ set, ctx }) => ({
			count: 0,
			inc: () => set((s) => ({ count: s.count + 1 })),
			reset: () => ctx.reset(),
		}),
		{
			name: "counter",
			plugins: [persist({ key: "counter", storage })],
		},
	);

const a = makeCounter();
a.inc();
a.inc();
a.inc();
flushSync(); // flush the persist write
console.log("instance A count:", a.count());
console.log("stored:", storage.getItem("counter"));

// A brand-new instance loads the persisted value on init.
const b = makeCounter();
console.log("instance B (fresh) loaded count:", b.count());
