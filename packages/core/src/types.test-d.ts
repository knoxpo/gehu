import { createStore } from "./createStore.js";

type Equal<A, B> =
	(<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type Expect<T extends true> = T;

const store = createStore(({ set, ctx }) => ({
	count: 0,
	user: { name: "alex", age: 1 },
	load: ctx.resource({ fetch: async () => "ok" }),
	save: ctx.mutation({ run: async (value: number) => value }),
	inc: () => set((s) => ({ count: s.count + 1 })),
}));

const topLevel = store.pick("count");
const nested = store.pick("user.name");
const selected = store.select((s) => s.user.age);

type _RootCount = Expect<Equal<ReturnType<typeof store.count>, number>>;
type _RootUser = Expect<Equal<ReturnType<typeof store.user>, { name: string; age: number }>>;
type _PickTop = Expect<Equal<ReturnType<typeof topLevel>, number>>;
type _PickNested = Expect<Equal<ReturnType<typeof nested>, string>>;
type _Select = Expect<Equal<ReturnType<typeof selected>, number>>;

store.subscribe(
	(s) => s.count,
	(_next, _prev) => {
		type _Next = Expect<Equal<typeof _next, number>>;
		type _Prev = Expect<Equal<typeof _prev, number>>;
		void (0 as unknown as _Next);
		void (0 as unknown as _Prev);
	},
);

// @ts-expect-error invalid nested state path
store.pick("user.missing");

// @ts-expect-error actions are not part of state paths
store.pick("inc");

// @ts-expect-error resources are not part of state paths
store.pick("load.data");

// @ts-expect-error mutations are not part of state paths
store.pick("save.status");
