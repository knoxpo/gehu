# @gehu-js/devtools

Event-based devtools integration for Gehu.

`@gehu-js/devtools` emits store lifecycle and state events through a small event bus. It does not ship a UI; it is the bridge layer used by external tools or browser extensions.

## Install

```sh
npm install @gehu-js/devtools @gehu-js/core
```

## Overview

Use this package when you want to observe Gehu stores without coupling the core runtime to a specific inspector UI.

Importing the package registers the `devtools: true` shorthand in `@gehu-js/core`.

## Main API

- `devtools(options?)` creates a devtools plugin
- `devtoolsBus` is the shared singleton bus used by the shorthand path
- `DevtoolsBus` is the class behind the bus
- `DevtoolsEvent` and `DevtoolsEventType` describe the emitted event protocol

Typical emitted events include:

- store creation
- action start/completion/failure
- state change
- resource loading/success/failure
- mutation start/success/failure
- linked store graph connections

## Example

```ts
import { createStore } from "@gehu-js/core";
import "@gehu-js/devtools";

const store = createStore(
  () => ({
    count: 0,
  }),
  {
    name: "counter",
    devtools: true,
  },
);
```

Full docs: https://github.com/knoxpo/gehu#readme
