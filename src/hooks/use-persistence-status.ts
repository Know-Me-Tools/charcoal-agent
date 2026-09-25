/**
 * Derives the thread view's local save-state indicator from the write queue
 * (chat-persistence-durability design decision 3): `saving` while any write
 * is pending, `saved` when none is pending and the last one succeeded,
 * `failed` after a failure until a later write succeeds. Real product state
 * via `useSyncExternalStore` over the queue's own subscription — no
 * test-only global, no build-mode branch — read directly by unit tests and
 * rendered as `data-persistence` on the thread view root.
 *
 * Also mounts the failure notice (design decision 6): one polite sonner
 * toast, with a stable id so a burst of failures updates one notice instead
 * of stacking, showing only the fixed plain-language copy — never the raw
 * error, which is already logged by the write queue for diagnosis.
 */
import { useEffect, useSyncExternalStore } from "react";
import { toast } from "sonner";
import {
  hasFailedWrite,
  pendingWriteCount,
  subscribeWriteFailures,
  subscribeWriteQueue,
} from "@/lib/db/write-queue";

export type PersistenceStatus = "saving" | "saved" | "failed";

const FAILURE_TOAST_ID = "knowme-persistence-failure";

export const PERSISTENCE_FAILURE_TEXT =
  "Couldn't save your latest messages on this device. They're still on screen, but may be missing after you reload.";

function getSnapshot(): PersistenceStatus {
  if (pendingWriteCount() > 0) return "saving";
  return hasFailedWrite() ? "failed" : "saved";
}

export function usePersistenceStatus(): PersistenceStatus {
  const status = useSyncExternalStore(subscribeWriteQueue, getSnapshot, getSnapshot);

  useEffect(
    () =>
      subscribeWriteFailures(() => {
        // Stable id: a further call while the toast is still showing
        // updates it in place instead of stacking a new one.
        toast(PERSISTENCE_FAILURE_TEXT, { id: FAILURE_TOAST_ID });
      }),
    [],
  );

  return status;
}
