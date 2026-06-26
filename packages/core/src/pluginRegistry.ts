// Lets @gehu/persist register how a `config.persist` shorthand becomes a plugin,
// without core ever importing @gehu/persist (keeps core pure / browser-free).
import type { PersistConfig, StoreConfig, StorePlugin } from "./types.js";

type PersistFactory = (
	persist: PersistConfig,
	config: StoreConfig,
) => StorePlugin;
type DevtoolsFactory = (config: StoreConfig) => StorePlugin;

let persistFactory: PersistFactory | null = null;
let devtoolsFactory: DevtoolsFactory | null = null;

export function setPersistFactory(factory: PersistFactory): void {
	persistFactory = factory;
}

export function getPersistFactory(): PersistFactory | null {
	return persistFactory;
}

export function setDevtoolsFactory(factory: DevtoolsFactory): void {
	devtoolsFactory = factory;
}

export function getDevtoolsFactory(): DevtoolsFactory | null {
	return devtoolsFactory;
}
