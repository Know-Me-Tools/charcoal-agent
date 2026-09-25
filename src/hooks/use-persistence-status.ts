/**
 * Derives the thread view's local save-state indicator from the write queue
 * (chat-persistence-durability design decision 3): `saving` while any write
 * is pending, `saved` when none is pending and the last one succeeded,
 * `failed` after a failure until a later write succeeds. Real product state
 * via `useSyncExternalStore` over the queue's own subscription — no
 * test-only global, no build-mode branch — read directly by unit tests and
 * rendered as `data-persistence` on the thread view root.
 *
 * This hook is state-derivation only. The failure toast is a separate,
 * app-wide concern owned by `src/components/common/persistence-notices.tsx`
 * (mounted once at the app root) — not by this hook, because this hook is
 * only ever used by the thread view (`enhanced-thread.tsx`), and a failure
 * can happen before any thread view has mounted (journal replay) or while
 * the user is on a non-thread route.
 */
import { useSyncExternalStore } from "react";
import { hasFailedWrite, pendingWriteCount, subscribeWriteQueue } from "@/lib/db/write-queue";

export type PersistenceStatus = "saving" | "saved" | "failed";

function getSnapshot(): PersistenceStatus {
  if (pendingWriteCount() > 0) return "saving";
  return hasFailedWrite() ? "failed" : "saved";
}

export function usePersistenceStatus(): PersistenceStatus {
  return useSyncExternalStore(subscribeWriteQueue, getSnapshot, getSnapshot);
}
