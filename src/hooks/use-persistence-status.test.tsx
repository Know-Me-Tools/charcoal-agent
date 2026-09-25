import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

let pendingCount = 0;
let failed = false;
const queueListeners = new Set<() => void>();

vi.mock("@/lib/db/write-queue", () => ({
  pendingWriteCount: () => pendingCount,
  hasFailedWrite: () => failed,
  subscribeWriteQueue: (listener: () => void) => {
    queueListeners.add(listener);
    return () => {
      queueListeners.delete(listener);
    };
  },
}));

const { usePersistenceStatus } = await import("./use-persistence-status");

function emitQueueChange(): void {
  for (const listener of queueListeners) listener();
}

beforeEach(() => {
  pendingCount = 0;
  failed = false;
  queueListeners.clear();
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
