import { makeStateKey, type StateKey } from "@angular/core";

/** TransferState key carrying Gehu store snapshots from server → client. */
export const GEHU_KEY: StateKey<Record<string, unknown>> = makeStateKey("gehu");
