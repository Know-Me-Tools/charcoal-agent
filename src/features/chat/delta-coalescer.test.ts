import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createDeltaCoalescer,
  HIDDEN_FLUSH_INTERVAL_MS,
  type DeltaSegment,
} from "./delta-coalescer";

/**
 * Deterministic harness: frames are pumped by hand, timers are vitest fake
 * timers, visibility is a flag. The commit log is the observable output.
 */
function makeHarness() {
  const commits: DeltaSegment[][] = [];
  let hidden = false;
  let nextFrameId = 1;
  const frames = new Map<number, () => void>();

  const coalescer = createDeltaCoalescer((segments) => commits.push(segments), {
    requestFrame: (cb) => {
      const id = nextFrameId++;
      frames.set(id, cb);
      return id;
    },
    cancelFrame: (id) => {
      frames.delete(id);
    },
    setTimer: (cb, ms) => setTimeout(cb, ms),
    clearTimer: (handle) => clearTimeout(handle as Parameters<typeof clearTimeout>[0]),
    isHidden: () => hidden,
  });

  const runFrame = () => {
    const pending = [...frames.values()];
    frames.clear();
    for (const cb of pending) cb();
  };

  return {
    coalescer,
    commits,
    runFrame,
    pendingFrames: () => frames.size,
    setHidden: (value: boolean) => {
      hidden = value;
    },
  };
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("delta-coalescer — visible (frame) mode", () => {
  it("coalesces many deltas inside one frame into exactly one commit", () => {
    const { coalescer, commits, runFrame, pendingFrames } = makeHarness();

    coalescer.push("text", "a");
    coalescer.push("text", "b");
    coalescer.push("text", "c");
    coalescer.push("thinking", "t1");
    coalescer.push("thinking", "t2");

    expect(commits).toEqual([]);
    expect(pendingFrames()).toBe(1); // one scheduled flush for the whole burst

    runFrame();

    expect(commits).toEqual([
      [
        { kind: "text", text: "abc" },
        { kind: "thinking", text: "t1t2" },
      ],
    ]);
    expect(pendingFrames()).toBe(0);
  });

  it("commits at most once per frame across a sustained burst", () => {
    const { coalescer, commits, runFrame } = makeHarness();

    coalescer.push("text", "a");
    coalescer.push("text", "b");
    runFrame();
    coalescer.push("text", "c");
    runFrame();
    coalescer.push("text", "d");
    runFrame();

    expect(commits).toEqual([[{ kind: "text", text: "ab" }], [{ kind: "text", text: "c" }], [{ kind: "text", text: "d" }]]);
  });

  it("never fires the timer path while visible", () => {
    const { coalescer, commits } = makeHarness();

    coalescer.push("text", "a");
    vi.advanceTimersByTime(10_000);

    expect(commits).toEqual([]);
  });
});

describe("delta-coalescer — flush (done / error / abort path)", () => {
  it("flush commits immediately and cancels the scheduled frame", () => {
    const { coalescer, commits, runFrame, pendingFrames } = makeHarness();

    coalescer.push("text", "a");
    coalescer.push("text", "b");
    coalescer.flush();

    expect(commits).toEqual([[{ kind: "text", text: "ab" }]]);
    expect(pendingFrames()).toBe(0);

    // The cancelled frame must not commit a second time (no duplication).
    runFrame();
    vi.advanceTimersByTime(10_000);
    expect(commits).toHaveLength(1);
  });

  it("flush on an empty buffer is a no-op", () => {
    const { coalescer, commits } = makeHarness();
    coalescer.flush();
    expect(commits).toEqual([]);
  });

  it("preserves order and content exactly across a mix of text kinds and explicit flushes", () => {
    const { coalescer, commits, runFrame } = makeHarness();

    coalescer.push("text", "a");
    coalescer.push("thinking", "t");
    coalescer.push("text", "b");
    coalescer.flush(); // e.g. a step/citation event arrives here
    coalescer.push("text", "c");
    runFrame();

    expect(commits).toEqual([
      [
        { kind: "text", text: "a" },
        { kind: "thinking", text: "t" },
        { kind: "text", text: "b" },
      ],
      [{ kind: "text", text: "c" }],
    ]);
  });
});

describe("delta-coalescer — hidden (timer) mode", () => {
  it("flushes via the 50 ms timer, not the frame scheduler", () => {
    const { coalescer, commits, pendingFrames, setHidden } = makeHarness();
    setHidden(true);

    coalescer.push("text", "a");
    expect(pendingFrames()).toBe(0);

    vi.advanceTimersByTime(HIDDEN_FLUSH_INTERVAL_MS - 1);
    expect(commits).toEqual([]);

    vi.advanceTimersByTime(1);
    expect(commits).toEqual([[{ kind: "text", text: "a" }]]);
  });

  it("commits at most once per 50 ms while hidden", () => {
    const { coalescer, commits, setHidden } = makeHarness();
    setHidden(true);

    coalescer.push("text", "a");
    coalescer.push("text", "b");
    vi.advanceTimersByTime(HIDDEN_FLUSH_INTERVAL_MS);
    expect(commits).toEqual([[{ kind: "text", text: "ab" }]]);

    coalescer.push("text", "c");
    coalescer.push("text", "d");
    vi.advanceTimersByTime(HIDDEN_FLUSH_INTERVAL_MS - 1);
    expect(commits).toHaveLength(1);
    vi.advanceTimersByTime(1);
    expect(commits).toEqual([[{ kind: "text", text: "ab" }], [{ kind: "text", text: "cd" }]]);
  });

  it("reschedule moves a pending frame flush onto the timer when the page hides", () => {
    const { coalescer, commits, runFrame, pendingFrames, setHidden } = makeHarness();

    coalescer.push("text", "a");
    expect(pendingFrames()).toBe(1);

    setHidden(true);
    coalescer.reschedule();

    // The frame was cancelled: pumping frames must not commit.
    expect(pendingFrames()).toBe(0);
    runFrame();
    expect(commits).toEqual([]);

    vi.advanceTimersByTime(HIDDEN_FLUSH_INTERVAL_MS);
    expect(commits).toEqual([[{ kind: "text", text: "a" }]]);
  });

  it("reschedule moves a pending timer flush onto the frame path when the page shows", () => {
    const { coalescer, commits, runFrame, setHidden } = makeHarness();
    setHidden(true);

    coalescer.push("text", "a");
    setHidden(false);
    coalescer.reschedule();

    vi.advanceTimersByTime(10_000);
    expect(commits).toEqual([]); // timer was cancelled

    runFrame();
    expect(commits).toEqual([[{ kind: "text", text: "a" }]]);
  });
});

describe("delta-coalescer — cancelPending", () => {
  it("drops the scheduled flush without committing; the buffer survives for an explicit flush", () => {
    const { coalescer, commits, runFrame } = makeHarness();

    coalescer.push("text", "a");
    coalescer.cancelPending();

    runFrame();
    vi.advanceTimersByTime(10_000);
    expect(commits).toEqual([]);

    coalescer.flush();
    expect(commits).toEqual([[{ kind: "text", text: "a" }]]);
  });
});
