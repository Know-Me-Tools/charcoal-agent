import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { startStallWatchdog, STALL_AFTER_MS } from "./stream-stall-watchdog";

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe("startStallWatchdog", () => {
  it("fires once when no bytes arrive for longer than the stall window", () => {
    const onStall = vi.fn();
    startStallWatchdog(onStall);
    vi.advanceTimersByTime(STALL_AFTER_MS - 1_000);
    expect(onStall).not.toHaveBeenCalled();
    vi.advanceTimersByTime(10_000);
    expect(onStall).toHaveBeenCalledOnce();
    vi.advanceTimersByTime(120_000);
    expect(onStall).toHaveBeenCalledOnce();
  });

  it("does not fire while bytes keep arriving, even over a long reply", () => {
    const onStall = vi.fn();
    const dog = startStallWatchdog(onStall);
    for (let i = 0; i < 40; i += 1) {
      vi.advanceTimersByTime(10_000); // a keep-alive every 10 s, 400 s in all
      dog.touch();
    }
    expect(onStall).not.toHaveBeenCalled();
  });

  it("a touch gives a fresh window (the page returned to the foreground)", () => {
    const onStall = vi.fn();
    const dog = startStallWatchdog(onStall);
    vi.advanceTimersByTime(40_000);
    dog.touch();
    vi.advanceTimersByTime(40_000);
    expect(onStall).not.toHaveBeenCalled();
    vi.advanceTimersByTime(10_000);
    expect(onStall).toHaveBeenCalledOnce();
  });

  it("stops checking after stop()", () => {
    const onStall = vi.fn();
    const dog = startStallWatchdog(onStall);
    dog.stop();
    vi.advanceTimersByTime(300_000);
    expect(onStall).not.toHaveBeenCalled();
  });
});
