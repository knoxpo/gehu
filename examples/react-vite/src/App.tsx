import { createStoreHook, useResource, useStoreApi } from "@gehu-js/react";
import { counterStore, userStore } from "./stores";

// Zustand-style bound hook.
const useCounter = createStoreHook(counterStore);

function Counter() {
	const count = useCounter((s) => s.count);
	const doubled = useCounter((s) => s.double()); // selector can call a computed
	const inc = useCounter((s) => s.inc);
	const dec = useCounter((s) => s.dec);
	const reset = useCounter((s) => s.reset);
	return (
		<section style={{ border: "1px solid #ddd", borderRadius: 8, padding: "1rem" }}>
			<h2>Counter (Zustand-style)</h2>
			<p style={{ fontSize: "2rem", margin: "0.5rem 0", fontWeight: 700 }}>{count}</p>
			<p style={{ color: "#666" }}>doubled = {doubled}</p>
			<div style={{ display: "flex", gap: 8 }}>
				<button type="button" onClick={() => dec()}>
					−
				</button>
				<button type="button" onClick={() => inc()}>
					+
				</button>
				<button type="button" onClick={() => reset()}>
					reset
				</button>
			</div>
		</section>
	);
}

function Users() {
	const api = useStoreApi(userStore);
	const user = useResource(userStore.user); // atomic resource view

	return (
		<section
			style={{ border: "1px solid #ddd", borderRadius: 8, padding: "1rem", marginTop: "1.5rem" }}
		>
			<h2>Resource (Jotai-atomic)</h2>
			<div style={{ display: "flex", gap: 8 }}>
				<button type="button" onClick={() => api.select("1")}>
					Load #1
				</button>
				<button type="button" onClick={() => api.select("2")}>
					Load #2
				</button>
			</div>
			<p>
				{user.loading
					? "loading…"
					: user.data
						? `${user.data.name} (#${user.data.id})`
						: "pick a user"}
				<span style={{ color: "#aaa" }}> · status: {user.status}</span>
			</p>
		</section>
	);
}

export function App() {
	return (
		<main style={{ fontFamily: "system-ui", maxWidth: "30rem", margin: "2rem auto" }}>
			<h1>Gehu · React (Vite, CSR)</h1>
			<Counter />
			<Users />
		</main>
	);
}
