// ctx.resource — async reads (md §7). Platform-agnostic: AbortController only
// (md §10). Manual by default; opt into reactive auto-fetch with autoRun.
import { RESOURCE, brand } from './brand.js';
import type {
  Emitter,
  ResourceOptions,
  ResourceStatus,
  SignalAdapter,
  StoreResource,
} from './types.js';

export function createResource<Data>(
  adapter: SignalAdapter,
  options: ResourceOptions<Data>,
  emit?: Emitter['emit'],
): StoreResource<Data> {
  const target = options.name;
  const data = adapter.signal<Data | undefined>(undefined);
  const status = adapter.signal<ResourceStatus>('idle');
  const error = adapter.signal<unknown>(null);
  const loading = adapter.computed(() => status() === 'loading');

  let controller: AbortController | null = null;

  const run = async (): Promise<Data> => {
    const enabled = options.enabled ? options.enabled() : true;
    if (!enabled) return data() as Data; // gated; leave current state untouched

    controller?.abort();
    const ac = new AbortController();
    controller = ac;
    status.set('loading');
    error.set(null);
    emit?.({ type: 'resource.loading', target });

    const max = options.retry ?? 0;
    let attempt = 0;
    for (;;) {
      try {
        const result = await options.fetch({ signal: ac.signal });
        if (ac.signal.aborted) return result; // superseded — discard, don't apply
        data.set(result);
        status.set('success');
        emit?.({ type: 'resource.success', target, payload: result });
        return result;
      } catch (err) {
        if (ac.signal.aborted) throw err; // superseded run; let the newer one win
        if (attempt++ < max) continue;
        error.set(err);
        status.set('error');
        emit?.({ type: 'resource.error', target, error: err });
        throw err;
      }
    }
  };

  // autoRun: re-fetch reactively when key/enabled change. key()/enabled() call
  // get(), so the effect tracks the relevant state signals automatically.
  if (options.autoRun) {
    let lastKey: string | undefined;
    adapter.effect(() => {
      const enabled = options.enabled ? options.enabled() : true;
      if (!enabled) return;
      const key = JSON.stringify(options.key ? options.key() : [options.name ?? '']);
      if (key === lastKey) return;
      lastKey = key;
      void run().catch(() => {}); // errors surface via the error signal
    });
  }

  const clear = (): void => {
    controller?.abort();
    controller = null;
    data.set(undefined);
    error.set(null);
    status.set('idle');
  };

  const resource: StoreResource<Data> = {
    data,
    loading,
    error,
    status,
    refetch: run,
    clear,
  };
  return brand(resource, RESOURCE);
}
