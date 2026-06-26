import { createStore } from "@gehu-js/core";
import {
	createStoreHook,
	GehuProvider,
	useResource,
	useSignal,
	useStore,
	useStoreApi,
} from "@gehu-js/react";
import { cleanup, fireEvent, render } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it } from "vitest";

afterEach(cleanup);

const makeCounter = () =>
	createStore(
		({ set, get }) => ({
			count: 0,
			other: 0,
			double: () => get().count * 2,
			inc: () => set((s) => ({ count: s.count + 1 })),
			bumpOther: () => set((s) => ({ other: s.other + 1 })),
		}),
		{ name: "counter" },
	);

const tick = () => new Promise<void>((r) => setTimeout(r, 0));

describe("@gehu-js/react", () => {
	it("createStoreHook: selector reads state + action, re-renders on change", async () => {
		const store = makeCounter();
		const useCounter = createStoreHook(store);
		function C() {
			const count = useCounter((s) => s.count);
			const inc = useCounter((s) => s.inc);
			return (
				<button type="button" onClick={() => inc()}>
					{count}
				</button>
			);
		}
		const { getByRole } = render(<C />);
		expect(getByRole("button").textContent).toBe("0");
		fireEvent.click(getByRole("button"));
		await tick();
		expect(getByRole("button").textContent).toBe("1");
	});

	it("selector is fine-grained — unrelated set does not re-render", async () => {
		const store = makeCounter();
		let renders = 0;
		function CountView() {
			renders++;
			const c = useStore(store, (s) => s.count);
			return <span>{c}</span>;
		}
		render(<CountView />);
		const before = renders;
		store.bumpOther();
		await tick();
		expect(renders).toBe(before); // other changed, count didn't → no re-render
		store.inc();
		await tick();
		expect(renders).toBe(before + 1);
	});

	it("useSignal: atomic read of a per-key accessor", async () => {
		const store = makeCounter();
		function V() {
			const c = useSignal(store.count);
			return <span>{c}</span>;
		}
		const { container } = render(<V />);
		expect(container.textContent).toBe("0");
		store.inc();
		await tick();
		expect(container.textContent).toBe("1");
	});

	it("useSignal: derived select() atom", async () => {
		const store = makeCounter();
		const doubled = store.select((s) => s.count * 2);
		function V() {
			return <span>{useSignal(doubled)}</span>;
		}
		const { container } = render(<V />);
		expect(container.textContent).toBe("0");
		store.inc();
		store.inc();
		await tick();
		expect(container.textContent).toBe("4");
	});

	it("useResource: idle → success", async () => {
		const store = createStore(
			({ ctx }) => ({ user: ctx.resource<string>({ name: "u", fetch: async () => "Alex" }) }),
			{ name: "users" },
		);
		function V() {
			const r = useResource(store.user);
			return (
				<span>
					{r.status}:{r.data ?? "-"}
				</span>
			);
		}
		const { container } = render(<V />);
		expect(container.textContent).toBe("idle:-");
		await store.user.refetch();
		await tick();
		expect(container.textContent).toBe("success:Alex");
	});

	it("GehuProvider isolates instances per subtree", async () => {
		const store = makeCounter();
		function C() {
			const c = useStore(store, (s) => s.count);
			const api = useStoreApi(store);
			return (
				<button type="button" onClick={() => api.inc()}>
					{c}
				</button>
			);
		}
		const a = render(
			<GehuProvider>
				<C />
			</GehuProvider>,
		);
		const b = render(
			<GehuProvider>
				<C />
			</GehuProvider>,
		);
		const btnA = a.container.querySelector("button") as HTMLButtonElement;
		const btnB = b.container.querySelector("button") as HTMLButtonElement;
		fireEvent.click(btnA);
		await tick();
		expect(btnA.textContent).toBe("1");
		expect(btnB.textContent).toBe("0"); // isolated
	});

	it("SSR: renderToString uses getServerSnapshot", () => {
		const store = createStore(
			({ set }) => ({ count: 5, inc: () => set((s) => ({ count: s.count + 1 })) }),
			{ name: "ssr" },
		);
		function V() {
			return <span>{useStore(store, (s) => s.count)}</span>;
		}
		const html = renderToString(<V />);
		expect(html).toContain("5");
	});
});
