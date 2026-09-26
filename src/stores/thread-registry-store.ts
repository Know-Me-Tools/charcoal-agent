/**
 * Thread Registry Store
 *
 * The canonical, persistent source of truth for all threads.
 * Each thread's `id` is the UUID used as `X-UAR-Session-ID` on the backend.
 * Threads start as `isEphemeral = true` and are promoted once the first
 * message has been sent. Ephemeral threads are hidden from the sidebar.
 *
 * Persisted to PGLite (IndexedDB) via CharcoalDb write-through on every mutation.
 */
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type { LocalThread } from "@/types";
import { enqueueWrite } from "@/lib/db/write-queue";
import { scrubThreadFromJournals } from "@/lib/db/persistence-journal";

interface ThreadRegistryState {
  threads: Record<string, LocalThread>;
  activeThreadId: string | null;
}

interface ThreadRegistryActions {
  /**
   * Hydrate the store from PGLite on startup.
   * Should be called once by the db-ready effect in the app shell.
   */
  initFromDb(threads: LocalThread[]): void;

  /**
   * Add a new thread to the registry. Always starts as ephemeral.
   * Idempotent — calling with an existing id is a no-op.
   */
  registerThread(id: string, agentId?: string, agentName?: string): void;

  /**
   * Promote an ephemeral thread to a persisted one.
   * Called after the first message has been sent successfully.
   */
  markPersisted(id: string): void;

  /** Update the LLM-generated title and refresh `updatedAt`. */
  setTitle(id: string, title: string): void;

  /** Touch `updatedAt` without changing other fields (e.g. after streaming). */
  touch(id: string): void;

  /** Set the currently viewed thread. */
  setActive(id: string | null): void;

  /** Remove a thread entirely (e.g. after delete). */
  removeThread(id: string): void;

  /**
   * Return the most-recently-updated non-ephemeral thread, or null if none exist.
   */
  getLatestPersisted(): LocalThread | null;
}

type ThreadRegistryStore = ThreadRegistryState & ThreadRegistryActions;

export const useThreadRegistryStore = create<ThreadRegistryStore>()(
  immer((set, get) => ({
    threads: {},
    activeThreadId: null,

    initFromDb: (threads) =>
      set((state) => {
        for (const t of threads) {
          state.threads[t.id] = t;
        }
      }),

    registerThread: (id, agentId, agentName) => {
      // `created` mirrors the producer's idempotent no-op: don't enqueue a
      // write for a thread that already existed.
      let created = false;

      set((state) => {
        if (state.threads[id]) return;
        created = true;
        const now = new Date().toISOString();
        state.threads[id] = {
          id,
          // sessionId mirrors id — stored explicitly so it can be read back
          // from PGLite after a page refresh without relying on URL params.
          sessionId: id,
          title: "New conversation",
          isEphemeral: true,
          createdAt: now,
          updatedAt: now,
          agentId,
          agentName,
        };
      });

      if (!created) return;
      // Read back committed state (get()), never the producer's immer
      // draft — see write-queue.ts's module doc.
      const thread = get().threads[id];
      if (thread) enqueueWrite({ kind: "upsertThread", thread });
    },

    markPersisted: (id) => {
      let changed = false;

      set((state) => {
        if (!state.threads[id]) return;
        changed = true;
        state.threads[id].isEphemeral = false;
        state.threads[id].updatedAt = new Date().toISOString();
      });

      if (!changed) return;
      const thread = get().threads[id];
      if (thread) enqueueWrite({ kind: "upsertThread", thread });
    },

    setTitle: (id, title) => {
      let changed = false;

      set((state) => {
        if (!state.threads[id]) return;
        changed = true;
        state.threads[id].title = title;
        state.threads[id].updatedAt = new Date().toISOString();
      });

      if (!changed) return;
      const thread = get().threads[id];
      if (thread) enqueueWrite({ kind: "upsertThread", thread });
    },

    touch: (id) => {
      let changed = false;

      set((state) => {
        if (!state.threads[id]) return;
        changed = true;
        state.threads[id].updatedAt = new Date().toISOString();
      });

      if (!changed) return;
      enqueueWrite({ kind: "touchThread", id, at: new Date().toISOString() });
    },

    setActive: (id) =>
      set((state) => {
        state.activeThreadId = id;
      }),

    removeThread: (id) => {
      set((state) => {
        delete state.threads[id];
        if (state.activeThreadId === id) {
          state.activeThreadId = null;
        }
      });
      // Synchronously scrub this thread out of every tab's page-exit
      // journal (this tab's and others', live or dead) BEFORE enqueuing the
      // delete, so a journal already on disk describing an upsert/touch for
      // this thread can never replay and resurrect it or restore a stale
      // field (operator decision 2026-09-26 in design.md).
      scrubThreadFromJournals(id);
      enqueueWrite({ kind: "deleteThread", id });
    },

    getLatestPersisted: () => {
      const { threads } = get();
      const persisted = Object.values(threads)
        .filter((t) => !t.isEphemeral)
        .sort(
          (a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
        );
      return persisted[0] ?? null;
    },
  })),
);
