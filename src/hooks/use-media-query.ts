import { useCallback, useSyncExternalStore } from "react";

function getSnapshot(query: string): boolean {
  return window.matchMedia(query).matches;
}

function getServerSnapshot(): boolean {
  return false;
}

/**
 * Tracks a CSS media query; re-renders when it starts or stops matching.
 *
 * `subscribe` and `getSnapshot` must stay referentially stable across
 * renders (keyed only on `query`, via `useCallback`). An inline closure
 * recreated on every render makes `useSyncExternalStore` tear down and
 * rebuild the `matchMedia` listener on every unrelated re-render of a
 * consumer — which opens a real window, between `removeEventListener` and
 * the next `addEventListener`, where a genuine browser "change" event fires
 * and is silently dropped. Nothing else then forces a re-render, so the
 * value gets stuck stale rather than merely delayed. This caused
 * e2e/shell.spec.ts's "sheets close when their layout goes away" to flake
 * under rapid viewport changes (320 -> 1024 -> 320 with no settle point):
 * the mobile sheet's host component missed the final breakpoint change and
 * never closed.
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const mql = window.matchMedia(query);
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    },
    [query],
  );
  const getQuerySnapshot = useCallback(() => getSnapshot(query), [query]);

  return useSyncExternalStore(subscribe, getQuerySnapshot, getServerSnapshot);
}
