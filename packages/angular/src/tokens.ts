import { InjectionToken } from "@angular/core";
import type { Store } from "@gehu/core";

export type GehuConfig = {
	devtools?: boolean;
	zoneless?: boolean;
	ssr?: boolean;
};

export const GEHU_CONFIG = new InjectionToken<GehuConfig>("gehu.config");

/** name → snapshot, used to seed `hydrate` on the client (md §13). */
export const GEHU_HYDRATION = new InjectionToken<Record<string, unknown>>(
	"gehu.hydration",
);

// Each store gets a stable token, so provideStore can register a
// component/feature-scoped instance that injectStore picks up.
const tokens = new WeakMap<object, InjectionToken<unknown>>();

export function tokenFor(
	store: Store<unknown> | object,
): InjectionToken<unknown> {
	let token = tokens.get(store as object);
	if (!token) {
		token = new InjectionToken<unknown>("gehu.store");
		tokens.set(store as object, token);
	}
	return token;
}
