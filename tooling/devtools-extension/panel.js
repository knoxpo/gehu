// Gehu DevTools panel. Single in-memory model, small render fn per sub-view.
// No framework, no build. Events arrive as DevtoolsEvent (packages/devtools/src/protocol.ts):
//   { type, store, at, target?, payload?, error? }

const tabId = chrome.devtools.inspectedWindow.tabId;
const port = chrome.runtime.connect({ name: "gehu-panel" });
port.postMessage({ kind: "init", tabId });
port.postMessage({ kind: "replay" }); // ask the page for buffered history

// ---- model -------------------------------------------------------------
const model = {
	events: [], // full timeline
	stores: new Map(), // name → { live, state, async: Map(target→{type,status,error}) }
	graph: {}, // name → string[]
	selectedStore: null,
	selectedEventIdx: null,
	paused: false,
	filters: {
		state: true,
		action: true,
		resource: true,
		mutation: true,
		linked: true,
		store: true,
	},
};
const MAX_EVENTS = 2000;

function group(type) {
	if (type.startsWith("state")) return "state";
	if (type.startsWith("action")) return "action";
	if (type.startsWith("resource")) return "resource";
	if (type.startsWith("mutation")) return "mutation";
	if (type.startsWith("linked")) return "linked";
	return "store";
}

function store(name) {
	let s = model.stores.get(name);
	if (!s) {
		s = { live: true, state: undefined, async: new Map() };
		model.stores.set(name, s);
	}
	return s;
}

function apply(ev) {
	const s = store(ev.store);
	switch (ev.type) {
		case "store.created":
			s.live = true;
			break;
		case "store.destroyed":
			s.live = false;
			break;
		case "state.changed":
			if (ev.payload && "next" in ev.payload) s.state = ev.payload.next;
			break;
		case "linkedStore.connected":
			if (ev.payload && ev.payload.stores) model.graph[ev.store] = ev.payload.stores;
			break;
	}
	if (ev.target) {
		const g = group(ev.type);
		if (g === "resource" || g === "mutation") {
			const status =
				ev.type.endsWith("loading") || ev.type.endsWith("started")
					? "loading"
					: ev.type.endsWith("success")
						? "success"
						: ev.type.endsWith("error")
							? "error"
							: "idle";
			s.async.set(ev.target, { kind: g, status, error: ev.error });
		}
	}
}

function ingest(ev) {
	apply(ev);
	model.events.push(ev);
	if (model.events.length > MAX_EVENTS) model.events.shift();
}

// ---- transport ---------------------------------------------------------
port.onMessage.addListener((msg) => {
	if (msg.kind === "event") {
		ingest(msg.event);
		if (!model.paused) render();
	} else if (msg.kind === "replay") {
		for (const ev of msg.events) ingest(ev);
		render();
	} else if (msg.kind === "ready") {
		// page (re)loaded — clear stale view, request fresh buffer
		port.postMessage({ kind: "replay" });
	}
});

// ---- helpers -----------------------------------------------------------
const $ = (sel) => document.querySelector(sel);
const el = (tag, cls, text) => {
	const n = document.createElement(tag);
	if (cls) n.className = cls;
	if (text != null) n.textContent = text;
	return n;
};
const fmtTime = (ts) => {
	const d = new Date(ts);
	return (
		String(d.getHours()).padStart(2, "0") +
		":" +
		String(d.getMinutes()).padStart(2, "0") +
		":" +
		String(d.getSeconds()).padStart(2, "0") +
		"." +
		String(d.getMilliseconds()).padStart(3, "0")
	);
};
function json(value) {
	try {
		return JSON.stringify(value, null, 2);
	} catch {
		return String(value);
	}
}

// ---- filter chips ------------------------------------------------------
const CHIP_COLORS = {
	state: "var(--accent)",
	action: "var(--blue)",
	resource: "var(--purple)",
	mutation: "var(--yellow)",
	linked: "var(--green)",
	store: "var(--muted)",
};
function renderFilters() {
	const host = $("#filters");
	host.innerHTML = "";
	for (const key of Object.keys(model.filters)) {
		const chip = el("span", "chip" + (model.filters[key] ? " on" : ""), key);
		if (model.filters[key]) chip.style.background = CHIP_COLORS[key];
		chip.onclick = () => {
			model.filters[key] = !model.filters[key];
			render();
		};
		host.appendChild(chip);
	}
}

// ---- registry + graph --------------------------------------------------
function renderRegistry() {
	const ul = $("#registry");
	ul.innerHTML = "";
	if (model.stores.size === 0) {
		ul.appendChild(el("li", "empty", "No Gehu stores detected"));
	}
	for (const [name, s] of model.stores) {
		const li = el("li", (s.live ? "" : "dead ") + (name === model.selectedStore ? "selected" : ""));
		li.appendChild(el("span", "dot"));
		li.appendChild(el("span", null, name));
		li.onclick = () => {
			model.selectedStore = name === model.selectedStore ? null : name;
			render();
		};
		ul.appendChild(li);
	}
}
function renderGraph() {
	const host = $("#graph");
	host.innerHTML = "";
	const names = Object.keys(model.graph);
	if (names.length === 0) {
		host.appendChild(el("div", "empty", "—"));
		return;
	}
	for (const name of names) {
		const line = el("div");
		line.appendChild(el("span", "node", name));
		line.appendChild(el("span", null, " → " + model.graph[name].join(", ")));
		host.appendChild(line);
	}
}

// ---- timeline ----------------------------------------------------------
function visibleEvents() {
	return model.events.filter((ev) => {
		if (!model.filters[group(ev.type)]) return false;
		if (model.selectedStore && ev.store !== model.selectedStore) return false;
		return true;
	});
}
function renderTimeline() {
	const view = $("#view-timeline");
	view.innerHTML = "";
	const evs = visibleEvents();
	if (evs.length === 0) {
		view.appendChild(el("div", "empty", "Waiting for store activity…"));
		return;
	}
	evs.forEach((ev) => {
		const idx = model.events.indexOf(ev);
		const row = el("div", "row" + (idx === model.selectedEventIdx ? " sel" : ""));
		row.appendChild(el("span", "time", fmtTime(ev.at)));
		row.appendChild(el("span", "store", ev.store));
		const cls = ev.error ? "t-error" : "t-" + group(ev.type);
		row.appendChild(el("span", "type " + cls, ev.type));
		if (ev.target) row.appendChild(el("span", "target", ev.target));
		const detail =
			ev.error != null
				? json(ev.error)
				: ev.type === "state.changed" && ev.payload
					? Object.keys(ev.payload.patch || {}).join(", ")
					: ev.payload != null
						? json(ev.payload)
						: "";
		if (detail) row.appendChild(el("span", "detail", detail));
		row.onclick = () => {
			model.selectedEventIdx = idx;
			if (ev.store) model.selectedStore = ev.store;
			switchTab("diff");
			render();
		};
		view.appendChild(row);
	});
	if (!model.paused) view.scrollTop = view.scrollHeight;
}

// ---- snapshot ----------------------------------------------------------
function renderSnapshot() {
	const view = $("#view-snapshot");
	view.innerHTML = "";
	const name = model.selectedStore;
	if (!name) {
		view.appendChild(el("div", "empty", "Select a store in the left rail."));
		return;
	}
	const s = model.stores.get(name);
	if (!s || s.state === undefined) {
		view.appendChild(
			el("div", "empty", "No state observed yet for " + name + " — trigger an action."),
		);
		return;
	}
	view.appendChild(el("pre", "json", json(s.state)));
}

// ---- patch diff --------------------------------------------------------
function renderDiff() {
	const view = $("#view-diff");
	view.innerHTML = "";
	const ev = model.selectedEventIdx != null ? model.events[model.selectedEventIdx] : null;
	if (!ev || ev.type !== "state.changed" || !ev.payload) {
		view.appendChild(el("div", "empty", "Select a state.changed row in the Timeline."));
		return;
	}
	const { prev = {}, patch = {} } = ev.payload;
	const keys = Object.keys(patch);
	if (keys.length === 0) {
		view.appendChild(el("div", "empty", "No keys changed."));
		return;
	}
	view.appendChild(el("div", "empty", ev.store + " @ " + fmtTime(ev.at)));
	for (const k of keys) {
		const block = el("div");
		block.appendChild(el("div", "diff-key", k + ":"));
		block.appendChild(el("pre", "json diff-prev", "- " + json(prev[k])));
		block.appendChild(el("pre", "json diff-next", "+ " + json(patch[k])));
		view.appendChild(block);
	}
}

// ---- resources / mutations --------------------------------------------
function renderAsync() {
	const view = $("#view-async");
	view.innerHTML = "";
	const rows = [];
	for (const [name, s] of model.stores) {
		if (model.selectedStore && name !== model.selectedStore) continue;
		for (const [target, a] of s.async) rows.push({ store: name, target, ...a });
	}
	if (rows.length === 0) {
		view.appendChild(el("div", "empty", "No resources or mutations observed."));
		return;
	}
	const table = el("table", "async");
	const head = el("tr");
	["Store", "Kind", "Name", "Status", "Error"].forEach((h) => head.appendChild(el("th", null, h)));
	table.appendChild(head);
	for (const r of rows) {
		const tr = el("tr");
		tr.appendChild(el("td", null, r.store));
		tr.appendChild(el("td", null, r.kind));
		tr.appendChild(el("td", null, r.target));
		tr.appendChild(el("td", "status-" + r.status, r.status));
		tr.appendChild(el("td", "status-error", r.error != null ? json(r.error) : ""));
		table.appendChild(tr);
	}
	view.appendChild(table);
}

// ---- perf hints --------------------------------------------------------
// Cheap heuristics over the stream. ponytail: heuristic list, not a profiler.
function renderPerf() {
	const view = $("#view-perf");
	view.innerHTML = "";
	const hints = [];

	// 1) Many state.changed within a single action (>5 between started/completed).
	let openAction = null,
		sinceStart = 0;
	for (const ev of model.events) {
		if (ev.type === "action.started") {
			openAction = ev;
			sinceStart = 0;
		} else if (ev.type === "state.changed" && openAction) sinceStart++;
		else if ((ev.type === "action.completed" || ev.type === "action.failed") && openAction) {
			if (sinceStart > 5)
				hints.push(
					`Action "${openAction.target}" on ${openAction.store} caused ${sinceStart} state changes — consider batching with a single set().`,
				);
			openAction = null;
		}
	}

	// 2) Rapid refetch loops: same resource loading ≥3× within 1s.
	const loads = {};
	for (const ev of model.events) {
		if (ev.type === "resource.loading" && ev.target) {
			const key = ev.store + "/" + ev.target;
			(loads[key] ||= []).push(ev.at);
		}
	}
	for (const [key, times] of Object.entries(loads)) {
		for (let i = 0; i + 2 < times.length; i++) {
			if (times[i + 2] - times[i] < 1000) {
				hints.push(
					`Resource "${key}" refetched 3×+ within 1s — check the resource key() for instability.`,
				);
				break;
			}
		}
	}

	// 3) Errors.
	const errs = model.events.filter((e) => e.error != null).length;
	if (errs > 0) hints.push(`${errs} error event(s) in the timeline — see red rows.`);

	if (hints.length === 0) {
		view.appendChild(el("div", "empty", "No issues detected."));
		return;
	}
	for (const h of hints) view.appendChild(el("div", "hint", h));
}

// ---- tabs --------------------------------------------------------------
let activeTab = "timeline";
function switchTab(name) {
	activeTab = name;
	document
		.querySelectorAll("#tabs button")
		.forEach((b) => b.classList.toggle("active", b.dataset.tab === name));
	document
		.querySelectorAll(".view")
		.forEach((v) => v.classList.toggle("hidden", v.id !== "view-" + name));
}
document.querySelectorAll("#tabs button").forEach((b) => {
	b.onclick = () => {
		switchTab(b.dataset.tab);
		render();
	};
});

// ---- toolbar -----------------------------------------------------------
$("#pause").onchange = (e) => {
	model.paused = e.target.checked;
};
$("#clear").onclick = () => {
	model.events = [];
	model.selectedEventIdx = null;
	render();
};
$("#export").onclick = () => {
	const snapshots = {};
	for (const [name, s] of model.stores) snapshots[name] = s.state;
	const data = {
		exportedAt: new Date().toISOString(),
		registry: [...model.stores.keys()],
		graph: model.graph,
		snapshots,
		timeline: model.events,
	};
	const blob = new Blob([json(data)], { type: "application/json" });
	const a = document.createElement("a");
	a.href = URL.createObjectURL(blob);
	a.download = "gehu-devtools-export.json";
	a.click();
	URL.revokeObjectURL(a.href);
};

// ---- render ------------------------------------------------------------
function render() {
	renderFilters();
	renderRegistry();
	renderGraph();
	if (activeTab === "timeline") renderTimeline();
	else if (activeTab === "snapshot") renderSnapshot();
	else if (activeTab === "diff") renderDiff();
	else if (activeTab === "async") renderAsync();
	else if (activeTab === "perf") renderPerf();
}

render();
