import { Counter } from "./counter";
import { Providers } from "./providers";

// Server Component. In a real app you'd compute this per request (DB/session)
// and/or use `dehydrate` from "@gehu-js/react/server" to snapshot real stores.
export default function Page() {
	const hydrate = { counter: { count: 42 } };
	return (
		<Providers hydrate={hydrate}>
			<Counter />
		</Providers>
	);
}
