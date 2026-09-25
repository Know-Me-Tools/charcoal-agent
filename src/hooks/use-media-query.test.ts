import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useMediaQuery } from "./use-media-query";

type Listener = () => void;

function mockMatchMedia(initial: boolean) {
  const listeners = new Set<Listener>();
  let addCalls = 0;
  let removeCalls = 0;
  const mql = {
    matches: initial,
    addEventListener: (_: string, l: Listener) => {
      addCalls += 1;
      listeners.add(l);
    },
    removeEventListener: (_: string, l: Listener) => {
      removeCalls += 1;
      listeners.delete(l);
    },
  };
  vi.spyOn(window, "matchMedia").mockImplementation(() => mql as unknown as MediaQueryList);
  return {
    listeners,
    get addCalls() {
      return addCalls;
    },
    get removeCalls() {
      return removeCalls;
    },
    set(matches: boolean) {
      mql.matches = matches;
      listeners.forEach((l) => l());
    },
  };
}

describe("useMediaQuery", () => {
  afterEach(() => vi.restoreAllMocks());

  it("returns the current match and follows changes", () => {
    const media = mockMatchMedia(false);
    const { result } = renderHook(() => useMediaQuery("(min-width: 1280px)"));
    expect(result.current).toBe(false);

    act(() => media.set(true));
    expect(result.current).toBe(true);
  });

  it("unsubscribes on unmount", () => {
    const media = mockMatchMedia(true);
    const { unmount } = renderHook(() => useMediaQuery("(min-width: 1280px)"));
    expect(media.listeners.size).toBe(1);
    unmount();
    expect(media.listeners.size).toBe(0);
  });

  // e2e/shell.spec.ts:186 ("sheets close when their layout goes away") was
  // flaky: rapid setViewportSize calls (320 -> 1024 -> 320, no settle in
  // between) could leave the mobile sidebar sheet open and its "Open
  // threads" button permanently missing. Root cause: `subscribe` was an
  // inline closure recreated on every render, so useSyncExternalStore tore
  // down and rebuilt the matchMedia listener on every unrelated re-render
  // of a component using this hook. That opened a window, between
  // removeEventListener and the next addEventListener, where a real browser
  // "change" event fires and is silently dropped — nothing else forces a
  // re-render afterward, so the value stays stuck stale indefinitely rather
  // than merely delayed. This is reproducible against `main` (unrelated to
  // this branch's chat changes) with `--repeat-each 10 --workers=1`.
  it("keeps the same matchMedia subscription across unrelated re-renders, instead of tearing it down and rebuilding it", () => {
    const media = mockMatchMedia(false);
    const { rerender } = renderHook(({ extra }: { extra: number }) => useMediaQuery("(min-width: 1280px)"), {
      initialProps: { extra: 0 },
    });
    expect(media.addCalls).toBe(1);
    expect(media.removeCalls).toBe(0);

    rerender({ extra: 1 });
    rerender({ extra: 2 });

    expect(media.addCalls).toBe(1);
    expect(media.removeCalls).toBe(0);
  });

  it("still follows a change event fired between two rapid unrelated re-renders", () => {
    const media = mockMatchMedia(false);
    const { result, rerender } = renderHook(({ extra }: { extra: number }) => useMediaQuery("(min-width: 1280px)"), {
      initialProps: { extra: 0 },
    });

    rerender({ extra: 1 });
    act(() => media.set(true));
    rerender({ extra: 2 });

    expect(result.current).toBe(true);
  });
});
