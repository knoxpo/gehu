// Runs in the page's MAIN world. Sets the hook the Gehu devtools bus calls
// (packages/devtools/src/bus.ts:22 → globalThis.__GEHU_DEVTOOLS__.send).
// Forwards every event to the content script via window.postMessage, and keeps
// a small replay buffer so a late-opening panel sees recent history.
(() => {
	if (window.__GEHU_DEVTOOLS__ && window.__GEHU_DEVTOOLS__.__gehuExt) return;

	const BUFFER_MAX = 500; // ponytail: ring buffer in page, no core change.
	const buffer = [];

	function post(message) {
		window.postMessage({ source: "gehu-devtools-page", ...message }, "*");
	}

	const hook = {
		__gehuExt: true,
		send(event) {
			buffer.push(event);
			if (buffer.length > BUFFER_MAX) buffer.shift();
			post({ kind: "event", event });
		},
	};
	// Preserve a send already installed before us (e.g. a custom bus hook).
	const existing = window.__GEHU_DEVTOOLS__;
	if (existing && typeof existing.send === "function") {
		const prev = existing.send;
		const mine = hook.send;
		hook.send = (event) => {
			try {
				prev(event);
			} catch {}
			mine(event);
		};
	}
	window.__GEHU_DEVTOOLS__ = hook;

	// Panel → page requests (relayed by content script).
	window.addEventListener("message", (e) => {
		if (e.source !== window) return;
		const d = e.data;
		if (!d || d.source !== "gehu-devtools-panel") return;
		if (d.kind === "replay") {
			post({ kind: "replay", events: buffer.slice() });
		}
	});

	post({ kind: "ready" });
})();
