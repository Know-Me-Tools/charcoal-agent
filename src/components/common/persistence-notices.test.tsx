import { act, render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { WriteDescriptor } from "@/lib/db/write-queue";

const toastMock = vi.fn();
vi.mock("sonner", () => ({ toast: toastMock }));

const failureListeners = new Set<(descriptor: WriteDescriptor, error: unknown) => void>();

vi.mock("@/lib/db/write-queue", () => ({
  subscribeWriteFailures: (listener: (descriptor: WriteDescriptor, error: unknown) => void) => {
    failureListeners.add(listener);
    return () => {
      failureListeners.delete(listener);
    };
  },
}));

const { PersistenceNotices, PERSISTENCE_FAILURE_TEXT } = await import("./persistence-notices");

const SAMPLE_DESCRIPTOR: WriteDescriptor = { kind: "touchThread", id: "t1" };

function emitFailure(
  descriptor: WriteDescriptor = SAMPLE_DESCRIPTOR,
  error: unknown = new Error("raw db error — must never reach the toast text"),
): void {
  for (const listener of failureListeners) listener(descriptor, error);
}

beforeEach(() => {
  failureListeners.clear();
  toastMock.mockClear();
});

describe("PersistenceNotices", () => {
  it("shows the fixed plain-language text and never the raw error", () => {
    // Mounted standalone — no router, no EnhancedThread, no thread route:
    // mirrors a write failure while the user is on a non-thread route
    // (e.g. /agents or /settings), which the old thread-scoped subscriber
    // could never see.
    render(<PersistenceNotices />);

    act(() => emitFailure());

    expect(toastMock).toHaveBeenCalledTimes(1);
    const [text] = toastMock.mock.calls[0];
    expect(text).toBe(PERSISTENCE_FAILURE_TEXT);
    expect(text).not.toContain("raw db error");
  });

  it("three failures in one burst all use the same stable toast id, so sonner updates one notice instead of stacking", () => {
    render(<PersistenceNotices />);

    act(() => {
      emitFailure();
      emitFailure();
      emitFailure();
    });

    expect(toastMock).toHaveBeenCalledTimes(3);
    const ids = toastMock.mock.calls.map((call) => (call[1] as { id: string }).id);
    expect(new Set(ids).size).toBe(1);
    for (const call of toastMock.mock.calls) {
      expect(call[0]).not.toContain("raw db error");
    }
  });

  it("stops notifying after unmount", () => {
    const { unmount } = render(<PersistenceNotices />);
    unmount();

    act(() => emitFailure());

    expect(toastMock).not.toHaveBeenCalled();
  });

  it("renders nothing — it's a side-effect-only mount point", () => {
    const { container } = render(<PersistenceNotices />);
    expect(container).toBeEmptyDOMElement();
  });
});
