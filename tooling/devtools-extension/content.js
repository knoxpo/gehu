// ISOLATED world. Injects inject.js into the page MAIN world, then relays
// messages both ways between the page and the devtools panel (via background).
(() => {
	// Inject the page-world script (web_accessible_resource).
	const s = document.createElement("script");
	s.src = chrome.runtime.getURL("inject.js");
	s.onload = () => s.remove();
	(document.head || document.documentElement).appendChild(s);

	let port = null;

	function connect() {
		port = chrome.runtime.connect({ name: "gehu-content" });
		port.onMessage.addListener((msg) => {
			// Panel → page (e.g. request replay).
			window.postMessage({ source: "gehu-devtools-panel", ...msg }, "*");
		});
		port.onDisconnect.addListener(() => {
			port = null;
		});
	}
	connect();

	// Page → panel.
	window.addEventListener("message", (e) => {
		if (e.source !== window) return;
		const d = e.data;
		if (!d || d.source !== "gehu-devtools-page") return;
		if (!port) connect();
		try {
			port.postMessage(d);
		} catch {
			connect();
			port.postMessage(d);
		}
	});
})();
