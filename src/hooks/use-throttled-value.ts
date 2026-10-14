import { useEffect, useState, useSyncExternalStore } from "react";

/**
 * Trailing throttle for a value that changes in bursts (task 1.4: the
 * streaming reply's text, which after task 1.2 still changes once per frame).
 *
 * While `active`, updates are emitted at most once per `intervalMs`: a change
 * that arrives at least an interval after the last emission passes through on
 * the next render, and a burst inside one interval collapses into a single
 * trailing emission carrying the latest value. While `active` is false the
 * hook is transparent and returns `value` unchanged, so the final text of a
 * finished stream renders synchronously rather than after a throttle window.
 *
 * Chosen over `useDeferredValue` for the markdown stream because the
 * acceptance bound is a rate — at most 10 parser inputs per second — and a
 * deferred value only lowers priority: React can still commit the deferred
 * render on every delta on an unloaded device.
 *
 * Implemented as an external store so the emissions are external-system
 * notifications rather than setState-in-effect, and mounting does not consume
 * an emission slot: the first change of a stream passes through immediately.
 */
interface ThrottleStore<T> {
  subscribe: (listener: () => void) => () => void;
  getSnapshot: () => T;
  push: (value: T, intervalMs: number, active: boolean) => void;
  dispose: () => void;
}

function createThrottleStore<T>(initial: T): ThrottleStore<T> {
  let emitted = initial;
  let pending = initial;
  let lastEmit = 0;
  let timer: ReturnType<typeof setTimeout> | null = null;
  const listeners = new Set<() => void>();

  const emit = (value: T) => {
    emitted = value;
    lastEmit = Date.now();
    for (const listener of listeners) listener();
  };

  return {
    subscribe: (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    getSnapshot: () => emitted,
    push: (value, intervalMs, active) => {
      pending = value;
      if (!active) {
        if (timer !== null) {
          clearTimeout(timer);
          timer = null;
        }
        if (emitted !== value) emit(value);
        return;
      }
      if (emitted === value) return;
      const elapsed = Date.now() - lastEmit;
      if (elapsed >= intervalMs) {
        if (timer !== null) {
          clearTimeout(timer);
          timer = null;
        }
        emit(value);
      } else if (timer === null) {
        timer = setTimeout(() => {
          timer = null;
          emit(pending);
        }, intervalMs - elapsed);
      }
    },
    dispose: () => {
      if (timer !== null) clearTimeout(timer);
    },
  };
}

export function useThrottledValue<T>(value: T, intervalMs: number, active: boolean): T {
  const [store] = useState(() => createThrottleStore(value));

  useEffect(() => {
    store.push(value, intervalMs, active);
  }, [store, value, intervalMs, active]);

  useEffect(() => () => store.dispose(), [store]);

  const emitted = useSyncExternalStore(store.subscribe, store.getSnapshot);
  return active ? emitted : value;
}
