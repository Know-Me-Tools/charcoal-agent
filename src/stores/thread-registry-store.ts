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
import { getDbInstance } from "@/lib/db/pglite";

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

function tryDb(): ReturnType<typeof getDbInstance> | null {
  try { return getDbInstance(); } catch { return null; }
}

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

    registerThread: (id, agentId, agentName) =>
      set((state) => {
        if (state.threads[id]) return;
        const now = new Date().toISOString();
        const thread: LocalThread = {
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
        state.threads[id] = thread;
        tryDb()?.upsertThread(thread).catch(console.error);
      }),

    markPersisted: (id) =>
      set((state) => {
        if (!state.threads[id]) return;
        state.threads[id].isEphemeral = false;
        state.threads[id].updatedAt = new Date().toISOString();
        const updated = state.threads[id];
        tryDb()?.upsertThread({ ...updated }).catch(console.error);
      }),

    setTitle: (id, title) =>
      set((state) => {
        if (!state.threads[id]) return;
        state.threads[id].title = title;
        state.threads[id].updatedAt = new Date().toISOString();
        const updated = state.threads[id];
        tryDb()?.upsertThread({ ...updated }).catch(console.error);
      }),

    touch: (id) =>
      set((state) => {
        if (!state.threads[id]) return;
        state.threads[id].updatedAt = new Date().toISOString();
        tryDb()?.touchThread(id).catch(console.error);
      }),

    setActive: (id) =>
      set((state) => {
        state.activeThreadId = id;
      }),

    removeThread: (id) =>
      set((state) => {
        delete state.threads[id];
        if (state.activeThreadId === id) {
          state.activeThreadId = null;
        }
        tryDb()?.deleteThread(id).catch(console.error);
      }),

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
