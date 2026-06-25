// Angular signal adapter (md §11, §12). The core SignalLike/WritableSignalLike
// shapes match Angular's Signal/WritableSignal exactly, so this is near-identity.
// effect() must be created in an injection context — buildStore runs inside one
// when the registry/provideStore build an instance, so cleanup is auto-tied to
// the injector (covers resource autoRun + DestroyRef).
import { computed, effect, signal } from '@angular/core';
import type { CleanupFn, SignalAdapter, SignalLike, WritableSignalLike } from '@gehu/core';

export const angularSignalAdapter: SignalAdapter = {
  signal: <T>(value: T): WritableSignalLike<T> => signal(value) as WritableSignalLike<T>,
  computed: <T>(fn: () => T): SignalLike<T> => computed(fn),
  effect: (fn: () => void): CleanupFn => {
    const ref = effect(fn);
    return () => ref.destroy();
  },
};
