/**
 * Mounts the app-wide local-save failure notice (chat-persistence-durability
 * design decision 6): one polite sonner toast, stable id (so a burst of
 * failures updates one notice instead of stacking), the fixed
 * plain-language copy only — never the raw error, which the write queue
 * already logs (`console.error`) for diagnosis.
 *
 * Mounted exactly once at the app root (`App.tsx`, next to `<Toaster/>`),
 * inside `DbProvider`'s ready tree — not by the thread view. Two failure
 * sources need a listener that isn't scoped to `/threads/:id`:
 *   - journal replay (`persistence-journal.ts`) reports failures from
 *     inside `DbProvider`, before `ready: true` and so before this
 *     component (or anything else) has mounted. The write queue latches
 *     that report and hands it to the first subscriber — this component —
 *     once it does (see `pendingNotice` in `write-queue.ts`).
 *   - a live write can fail while the user is on a non-thread route (the
 *     thread registry writes on rename, delete, etc.), which the old
 *     thread-scoped subscriber could never see.
 *
 * `usePersistenceStatus` (used by `enhanced-thread.tsx`) only derives the
 * `data-persistence` attribute now; it no longer owns the toast.
 */
import { useEffect } from "react";
import { toast } from "sonner";
import { subscribeWriteFailures } from "@/lib/db/write-queue";

const FAILURE_TOAST_ID = "knowme-persistence-failure";

export const PERSISTENCE_FAILURE_TEXT =
  "Couldn't save your latest messages on this device. They're still on screen, but may be missing after you reload.";

export function PersistenceNotices() {
  useEffect(
    () =>
      subscribeWriteFailures(() => {
        // Stable id: a further call while the toast is still showing
        // updates it in place instead of stacking a new one.
        toast(PERSISTENCE_FAILURE_TEXT, { id: FAILURE_TOAST_ID });
      }),
    [],
  );

  return null;
}
