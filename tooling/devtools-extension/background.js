// Relays between content scripts (keyed by tabId) and devtools panels.
// A devtools panel cannot talk to a content script directly — this is the bridge.
const contentByTab = new Map(); // tabId → content port
const panelByTab = new Map(); // tabId → panel port

chrome.runtime.onConnect.addListener((port) => {
	if (port.name === "gehu-content") {
		const tabId = port.sender && port.sender.tab && port.sender.tab.id;
		if (tabId == null) return;
		contentByTab.set(tabId, port);
		port.onMessage.addListener((msg) => {
			const panel = panelByTab.get(tabId);
			if (panel) panel.postMessage(msg);
		});
		port.onDisconnect.addListener(() => {
			if (contentByTab.get(tabId) === port) contentByTab.delete(tabId);
		});
		return;
	}

	if (port.name === "gehu-panel") {
		let tabId = null;
		port.onMessage.addListener((msg) => {
			if (msg && msg.kind === "init") {
				tabId = msg.tabId;
				panelByTab.set(tabId, port);
				return;
			}
			// Panel → content (e.g. replay request).
			if (tabId != null) {
				const content = contentByTab.get(tabId);
				if (content) content.postMessage(msg);
			}
		});
		port.onDisconnect.addListener(() => {
			if (tabId != null && panelByTab.get(tabId) === port) panelByTab.delete(tabId);
		});
	}
});
