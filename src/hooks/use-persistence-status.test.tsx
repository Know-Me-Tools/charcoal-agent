import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { WriteDescriptor } from "@/lib/db/write-queue";

const toastMock = vi.fn();
vi.mock("sonner", () => ({ toast: toastMock }));

let pendingCount = 0;
let failed = false;
const queueListeners = new Set<() => void>();
const failureListeners = new Set<(descriptor: WriteDescriptor, error: unknown) => void>();

vi.mock("@/lib/db/write-queue", () => ({
  pendingWriteCount: () => pendingCount,
  hasFailedWrite: () => failed,
  subscribeWriteQueue: (listener: () => void) => {
    queueListeners.add(listener);
    return () => {
      queueListeners.delete(listener);
    };
  },
  subscribeWriteFailures: (listener: (descriptor: WriteDescriptor, error: unknown) => void) => {
    failureListeners.add(listener);
    return () => {
      failureListeners.delete(listener);
    };
  },
}));

const { usePersistenceStatus, PERSISTENCE_FAILURE_TEXT } = await import("./use-persistence-status");

function emitQueueChange(): void {
  for (const listener of queueListeners) listener();
}

const SAMPLE_DESCRIPTOR: WriteDescriptor = { kind: "touchThread", id: "t1" };

function emitFailure(
  descriptor: WriteDescriptor = SAMPLE_DESCRIPTOR,
  error: unknown = new Error("raw db error — must never reach the toast text"),
): void {
  for (const listener of failureListeners) listener(descriptor, error);
}

beforeEach(() => {
  pendingCount = 0;
  failed = false;
  queueListeners.clear();
  failureListeners.clear();
  toastMock.mockClear();
});

describe("usePersistenceStatus: save-state derivation", () => {
  it("reads saved when nothing is pending and nothing has failed", () => {
    const { result } = renderHook(() => usePersistenceStatus());
    expect(result.current).toBe("saved");
  });

  it("reads saving while a write is pending, then saved once it settles", () => {
    pendingCount = 1;
    const { result } = renderHook(() => usePersistenceStatus());
    expect(result.current).toBe("saving");

    act(() => {
      pendingCount = 0;
      emitQueueChange();
    });

    expect(result.current).toBe("saved");
  });

  it("reads failed after a failure, and saved again after a later success", () => {
    const { result } = renderHook(() => usePersistenceStatus());
    expect(result.current).toBe("saved");

    act(() => {
      failed = true;
      emitQueueChange();
    });
    expect(result.current).toBe("failed");

    act(() => {
      failed = false;
      emitQueueChange();
    });
    expect(result.current).toBe("saved");
  });

  it("reads saving even while a prior failure is still unresolved", () => {
    failed = true;
    pendingCount = 1;
    const { result } = renderHook(() => usePersistenceStatus());
    expect(result.current).toBe("saving");
  });
});

describe("usePersistenceStatus: failure notice", () => {
  it("shows the fixed plain-language text and never the raw error", () => {
    renderHook(() => usePersistenceStatus());

    act(() => emitFailure());

    expect(toastMock).toHaveBeenCalledTimes(1);
    const [text] = toastMock.mock.calls[0];
    expect(text).toBe(PERSISTENCE_FAILURE_TEXT);
    expect(text).not.toContain("raw db error");
  });

  it("three failures in one burst all use the same stable toast id, so sonner updates one notice instead of stacking", () => {
    renderHook(() => usePersistenceStatus());

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
    const { unmount } = renderHook(() => usePersistenceStatus());
    unmount();

    act(() => emitFailure());

    expect(toastMock).not.toHaveBeenCalled();
  });
});
