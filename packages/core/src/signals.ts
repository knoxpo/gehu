// Internal reactive core (md §11). Platform-agnostic: no framework, no globals
// beyond queueMicrotask. Pull-based reads, lazy computeds, microtask-batched
// effects. Coarse-grained is fine for Phase 1.
import type { CleanupFn, SignalAdapter, SignalLike, WritableSignalLike } from "./types.js";

interface Producer {
	consumers: Set<Consumer>;
}

interface Consumer {
	sources: Set<Producer>;
	onChange(): void;
}

let activeConsumer: Consumer | null = null;

function link(p: Producer): void {
	if (activeConsumer) {
		activeConsumer.sources.add(p);
		p.consumers.add(activeConsumer);
	}
}

function unlink(c: Consumer): void {
	for (const s of c.sources) s.consumers.delete(c);
	c.sources.clear();
}

// --- effect scheduling: dedupe into a microtask-flushed queue ---
const queue = new Set<EffectNode>();
let scheduled = false;

function schedule(e: EffectNode): void {
	queue.add(e);
	if (!scheduled) {
		scheduled = true;
		queueMicrotask(flush);
	}
}

function flush(): void {
	scheduled = false;
	const pending = [...queue];
	queue.clear();
	for (const e of pending) e.run();
}

class SignalNode<T> implements Producer {
	consumers = new Set<Consumer>();
	constructor(public value: T) {}

	read = (): T => {
		link(this);
		return this.value;
	};

	set = (next: T): void => {
		if (Object.is(next, this.value)) return;
		this.value = next;
		// Snapshot consumers: onChange mutates the set during propagation.
		for (const c of [...this.consumers]) c.onChange();
	};

	update = (fn: (v: T) => T): void => this.set(fn(this.value));
}

class ComputedNode<T> implements Producer, Consumer {
	consumers = new Set<Consumer>();
	sources = new Set<Producer>();
	private dirty = true;
	private value!: T;
	constructor(private fn: () => T) {}

	read = (): T => {
		if (this.dirty) this.recompute();
		link(this);
		return this.value;
	};

	private recompute(): void {
		unlink(this);
		const prev = activeConsumer;
		activeConsumer = this;
		try {
			this.value = this.fn();
		} finally {
			activeConsumer = prev;
		}
		this.dirty = false;
	}

	onChange(): void {
		if (this.dirty) return;
		this.dirty = true;
		for (const c of [...this.consumers]) c.onChange();
	}
}

class EffectNode implements Consumer {
	sources = new Set<Producer>();
	private active = true;
	constructor(private fn: () => void) {
		this.run();
	}

	run = (): void => {
		if (!this.active) return;
		unlink(this);
		const prev = activeConsumer;
		activeConsumer = this;
		try {
			this.fn();
		} finally {
			activeConsumer = prev;
		}
	};

	onChange(): void {
		schedule(this);
	}

	dispose = (): void => {
		this.active = false;
		unlink(this);
		queue.delete(this);
	};
}

function signal<T>(value: T): WritableSignalLike<T> {
	const node = new SignalNode(value);
	const accessor = (() => node.read()) as WritableSignalLike<T>;
	accessor.set = node.set;
	accessor.update = node.update;
	return accessor;
}

function computed<T>(fn: () => T): SignalLike<T> {
	const node = new ComputedNode(fn);
	return () => node.read();
}

function effect(fn: () => void): CleanupFn {
	return new EffectNode(fn).dispose;
}

/** Default internal signal adapter. Angular adapter (Phase 3) substitutes its own. */
export const defaultAdapter: SignalAdapter = { signal, computed, effect };

/** Run pending effects synchronously — used by tests (md §16 flushEffects). */
export function flushSync(): void {
	if (scheduled || queue.size) flush();
}
