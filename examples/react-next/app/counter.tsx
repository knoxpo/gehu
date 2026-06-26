"use client";
import { createStoreHook, useStoreApi } from "@gehu-js/react";
import { counterStore } from "./stores";

const useCounter = createStoreHook(counterStore);

export function Counter() {
	const count = useCounter((s) => s.count);
	const doubled = useCounter((s) => s.double());
	const api = useStoreApi(counterStore);

	return (
		<main
			style={{
				fontFamily: "system-ui",
				maxWidth: "26rem",
				margin: "4rem auto",
				textAlign: "center",
			}}
		>
			<h1>Gehu · Next.js (SSR + hydration)</h1>
			<p style={{ fontSize: "3rem", margin: "0.5rem" }} data-testid="count">
				{count}
			</p>
			<p style={{ color: "#666" }}>doubled = {doubled}</p>
			<p style={{ color: "#888", fontSize: "0.85rem" }}>
				rendered on the server with count = 42, transferred and hydrated on the client.
			</p>
			<div style={{ display: "flex", gap: "0.5rem", justifyContent: "center" }}>
				<button type="button" onClick={() => api.inc()}>
					+
				</button>
				<button type="button" onClick={() => api.reset()}>
					reset
				</button>
			</div>
		</main>
	);
}
