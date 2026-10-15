import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useCopyToClipboard } from "./use-copy-to-clipboard";

// jsdom exposes no clipboard; each test stubs (or deliberately omits) one.
function stubClipboard(writeText?: (text: string) => Promise<void>) {
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: writeText ? { writeText } : undefined,
  });
}

afterEach(() => {
  stubClipboard(undefined);
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("useCopyToClipboard", () => {
  it("copies the text and reports 'copied'", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    stubClipboard(writeText);
    const { result } = renderHook(() => useCopyToClipboard());

    expect(result.current.status).toBe("idle");
    await act(async () => {
      await result.current.copy("const answer = 42");
    });

    expect(writeText).toHaveBeenCalledWith("const answer = 42");
    expect(result.current.status).toBe("copied");
  });

  it("resets to idle after 2.5 s", async () => {
    vi.useFakeTimers();
    stubClipboard(vi.fn().mockResolvedValue(undefined));
    const { result } = renderHook(() => useCopyToClipboard());

    await act(async () => {
      await result.current.copy("x");
    });
    expect(result.current.status).toBe("copied");

    act(() => vi.advanceTimersByTime(2499));
    expect(result.current.status).toBe("copied");
    act(() => vi.advanceTimersByTime(1));
    expect(result.current.status).toBe("idle");
  });

  it("restarts the reset window when copy runs again during it", async () => {
    vi.useFakeTimers();
    stubClipboard(vi.fn().mockResolvedValue(undefined));
    const { result } = renderHook(() => useCopyToClipboard());

    await act(async () => {
      await result.current.copy("a");
    });
    act(() => vi.advanceTimersByTime(2000));
    await act(async () => {
      await result.current.copy("b");
    });

    // 2 s into the second window: still copied — the first timer must not fire.
    act(() => vi.advanceTimersByTime(2000));
    expect(result.current.status).toBe("copied");
    act(() => vi.advanceTimersByTime(500));
    expect(result.current.status).toBe("idle");
  });

  it("a rejected write reports 'failed', runs the selection fallback and never rejects", async () => {
    stubClipboard(vi.fn().mockRejectedValue(new Error("Write permission denied")));
    const selectFallback = vi.fn();
    const { result } = renderHook(() => useCopyToClipboard({ selectFallback }));

    // A rejection from writeText would surface here as a test failure.
    await act(async () => {
      await result.current.copy("x");
    });

    expect(result.current.status).toBe("failed");
    expect(selectFallback).toHaveBeenCalledOnce();
  });

  it("a missing clipboard API reports 'failed' and runs the fallback, without throwing", async () => {
    stubClipboard(undefined);
    const selectFallback = vi.fn();
    const { result } = renderHook(() => useCopyToClipboard({ selectFallback }));

    await act(async () => {
      await result.current.copy("x");
    });

    expect(result.current.status).toBe("failed");
    expect(selectFallback).toHaveBeenCalledOnce();
  });

  it("does not require a fallback: failure is still reported when none is given", async () => {
    stubClipboard(undefined);
    const { result } = renderHook(() => useCopyToClipboard());

    await act(async () => {
      await result.current.copy("x");
    });

    expect(result.current.status).toBe("failed");
  });

  it("the failed state also resets after 2.5 s", async () => {
    vi.useFakeTimers();
    stubClipboard(vi.fn().mockRejectedValue(new Error("denied")));
    const { result } = renderHook(() => useCopyToClipboard());

    await act(async () => {
      await result.current.copy("x");
    });
    expect(result.current.status).toBe("failed");

    act(() => vi.advanceTimersByTime(2500));
    expect(result.current.status).toBe("idle");
  });

  it("cancels a pending reset on unmount, so no setState fires afterwards", async () => {
    vi.useFakeTimers();
    stubClipboard(vi.fn().mockResolvedValue(undefined));
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    const { result, unmount } = renderHook(() => useCopyToClipboard());

    await act(async () => {
      await result.current.copy("x");
    });
    expect(result.current.status).toBe("copied");

    unmount();
    expect(vi.getTimerCount()).toBe(0);
    act(() => vi.advanceTimersByTime(5000));
    expect(consoleError).not.toHaveBeenCalled();
  });
});
