/**
 * Buffers streaming text/thinking deltas and commits them in batches, so a
 * token-per-event stream does not cost a store commit (and a full thread
 * re-render) per token. Flushes at most once per animation frame while the
 * page is visible and at most once per HIDDEN_FLUSH_INTERVAL_MS while it is
 * hidden (requestAnimationFrame does not run in a backgrounded tab).
 *
 * Pure module: all scheduling is injected, so tests control time. Ordering
 * rule the caller relies on: `flush()` is synchronous and MUST be called
 * before dispatching any non-text event and before done/error/abort/cancel
 * handling, so buffered text is never lost, duplicated or reordered relative
 * to other events.
 */

export type DeltaKind = "text" | "thinking";

/** One committed run of same-kind deltas, in arrival order. */
export interface DeltaSegment {
  kind: DeltaKind;
  text: string;
}

export interface DeltaCoalescerSchedulers {
  /** requestAnimationFrame equivalent; returns a handle for cancelFrame. */
  requestFrame(callback: () => void): number;
  cancelFrame(handle: number): void;
  /** setTimeout equivalent, used only while the page is hidden. */
  setTimer(callback: () => void, delayMs: number): unknown;
  clearTimer(handle: unknown): void;
  /** document.hidden at scheduling time. */
  isHidden(): boolean;
}

export const HIDDEN_FLUSH_INTERVAL_MS = 50;

export interface DeltaCoalescer {
  /** Append a delta; schedules a flush if none is pending. Empty text is ignored. */
  push(kind: DeltaKind, text: string): void;
  /**
   * Commit the buffer synchronously, in order, and cancel any scheduled
   * flush. No-op on an empty buffer. This is the done/error/abort path.
   */
  flush(): void;
  /**
   * Re-evaluate the scheduler after a visibility change: a pending frame
   * flush would never fire while hidden, so it is moved to the timer path
   * (and vice versa). No-op when the buffer is empty.
   */
  reschedule(): void;
  /** Cancel a scheduled flush without committing; the buffer is retained. */
  cancelPending(): void;
}

export function createDeltaCoalescer(
  commit: (segments: DeltaSegment[]) => void,
  schedulers: DeltaCoalescerSchedulers,
): DeltaCoalescer {
  // Consecutive same-kind deltas are merged at push time, so a burst of N
  // text tokens commits as exactly one segment.
  let segments: DeltaSegment[] = [];
  let frameHandle: number | null = null;
  let timerHandle: unknown = null;

  function cancelScheduled(): void {
    if (frameHandle !== null) {
      schedulers.cancelFrame(frameHandle);
      frameHandle = null;
    }
    if (timerHandle !== null) {
      schedulers.clearTimer(timerHandle);
      timerHandle = null;
    }
  }

  function flush(): void {
    cancelScheduled();
    if (segments.length === 0) return;
    const pending = segments;
    segments = [];
    commit(pending);
  }

  function schedule(): void {
    if (frameHandle !== null || timerHandle !== null || segments.length === 0) return;
    if (schedulers.isHidden()) {
      timerHandle = schedulers.setTimer(flush, HIDDEN_FLUSH_INTERVAL_MS);
    } else {
      frameHandle = schedulers.requestFrame(flush);
    }
  }

  return {
    push(kind, text) {
      if (!text) return;
      const last = segments[segments.length - 1];
      if (last && last.kind === kind) {
        last.text += text;
      } else {
        segments.push({ kind, text });
      }
      schedule();
    },
    flush,
    reschedule() {
      cancelScheduled();
      schedule();
    },
    cancelPending: cancelScheduled,
  };
}
