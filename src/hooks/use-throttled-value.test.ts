import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useThrottledValue } from "./use-throttled-value";

describe("useThrottledValue", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(1_000_000);
  });
  afterEach(() => vi.useRealTimers());

  it("passes the value through unchanged while inactive", () => {
    const { result, rerender } = renderHook(
      ({ value, active }) => useThrottledValue(value, 100, active),
      { initialProps: { value: "v0", active: false } },
    );
    expect(result.current).toBe("v0");

    rerender({ value: "v1", active: false });
    expect(result.current).toBe("v1");
  });

  it("emits the first change immediately, then holds changes inside one interval", () => {
    const { result, rerender } = renderHook(
      ({ value, active }) => useThrottledValue(value, 100, active),
      { initialProps: { value: "v0", active: true } },
    );
    expect(result.current).toBe("v0");

    // First change: no emission has happened yet, so it passes straight through.
    rerender({ value: "v1", active: true });
    expect(result.current).toBe("v1");

    // Changes inside the window are held back.
    rerender({ value: "v2", active: true });
    rerender({ value: "v3", active: true });
    expect(result.current).toBe("v1");
  });

  it("flushes the latest held value on the interval boundary", () => {
    const { result, rerender } = renderHook(
      ({ value, active }) => useThrottledValue(value, 100, active),
      { initialProps: { value: "v0", active: true } },
    );
    rerender({ value: "v1", active: true });
    expect(result.current).toBe("v1");

    rerender({ value: "v2", active: true });
    rerender({ value: "v3", active: true });
    expect(result.current).toBe("v1");

    act(() => vi.advanceTimersByTime(100));
    expect(result.current).toBe("v3");
  });

  it("spaces consecutive emissions at least one interval apart across a sustained burst", () => {
    const { result, rerender } = renderHook(({ value }) => useThrottledValue(value, 100, true), {
      initialProps: { value: "v0" },
    });

    // One second of streaming at 100 deltas/s; record the time of every
    // change in the emitted value. Check after both the rerender (immediate
    // emissions) and the timer advance (trailing flushes) so each emission is
    // stamped at the time it actually happened.
    const emissionTimes: number[] = [];
    let previous = result.current;
    const record = () => {
      if (result.current !== previous) {
        emissionTimes.push(Date.now());
        previous = result.current;
      }
    };
    for (let i = 1; i <= 100; i += 1) {
      rerender({ value: `v${i}` });
      record();
      act(() => vi.advanceTimersByTime(10));
      record();
    }
    act(() => vi.advanceTimersByTime(200));
    record();

    // The burst never stalls the trailing value, and the emission rate stays
    // at or under 10 per second.
    expect(result.current).toBe("v100");
    for (let k = 1; k < emissionTimes.length; k += 1) {
      expect(emissionTimes[k] - emissionTimes[k - 1]).toBeGreaterThanOrEqual(100);
    }
  });

  it("returns the latest value synchronously when streaming ends, even with a flush pending", () => {
    const { result, rerender } = renderHook(
      ({ value, active }) => useThrottledValue(value, 100, active),
      { initialProps: { value: "v0", active: true } },
    );
    rerender({ value: "v1", active: true });
    expect(result.current).toBe("v1");

    rerender({ value: "v2", active: true });
    expect(result.current).toBe("v1"); // held inside the window

    // Stream ends: the raw value bypasses the throttle in the same render.
    rerender({ value: "v2", active: false });
    expect(result.current).toBe("v2");

    // The pending timer must not fire a stale emission afterwards.
    act(() => vi.advanceTimersByTime(500));
    rerender({ value: "v2", active: false });
    expect(result.current).toBe("v2");
  });
});
