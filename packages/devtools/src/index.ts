// @gehu-js/devtools — event bridge only (md §15). No extension UI in this bundle.
import { setDevtoolsFactory } from "@gehu-js/core";
import { devtools } from "./devtools.js";

export { DevtoolsBus, devtoolsBus } from "./bus.js";
export type { DevtoolsOptions } from "./devtools.js";
export { devtools } from "./devtools.js";
export type { DevtoolsEvent, DevtoolsEventType } from "./protocol.js";

// Register the `devtools: true` shorthand. Side-effect on import — tree-shakable:
// no import of @gehu-js/devtools ⇒ none of this ships.
setDevtoolsFactory(() => devtools());
