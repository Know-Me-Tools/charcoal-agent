import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { CharcoalDb, setDbInstance } from "@/lib/db/pglite";
import { replayJournal } from "@/lib/db/persistence-journal";

const DB_NAME = "/charcoal-db";

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

type DbContextValue =
  | { ready: false; db: null }
  | { ready: true; db: CharcoalDb };

const DbContext = createContext<DbContextValue>({ ready: false, db: null });

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** True when the error message indicates a corrupted / stale PGLite bundle. */
function isCorruptionError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return msg.includes("Invalid FS bundle size") || msg.includes("bundle size");
}

/** Delete the PGLite IndexedDB and return once complete (or after timeout). */
function purgeDatabase(): Promise<void> {
  return new Promise((resolve) => {
    const req = indexedDB.deleteDatabase(DB_NAME);
    req.onsuccess = () => resolve();
    req.onerror = () => resolve(); // best-effort; proceed regardless
    req.onblocked = () => resolve();
    // Fallback in case the event never fires
    setTimeout(resolve, 2000);
  });
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

interface DbProviderProps {
  children: ReactNode;
}

export function DbProvider({ children }: DbProviderProps) {
  const [value, setValue] = useState<DbContextValue>({ ready: false, db: null });
  const [status, setStatus] = useState<string>("Starting up…");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function init(isRetry = false) {
      try {
        const db = await CharcoalDb.open((msg) => {
          if (!cancelled) setStatus(msg);
        });
        if (cancelled) return;

        // Replay any writes that were still pending when the page last
        // exited, directly against `db` (before setDbInstance below), so
        // the first hydration read already sees the result — after
        // migrations, before `ready: true` (chat-persistence-durability
        // design decision 5).
        setStatus("Recovering any unsaved messages…");
        await replayJournal(db);
        if (cancelled) return;

        setDbInstance(db);
        setValue({ ready: true, db });
      } catch (err: unknown) {
        if (cancelled) return;

        if (!isRetry && isCorruptionError(err)) {
          // Stale / corrupt PGLite bundle — wipe and retry once.
          console.warn("[CharcoalDb] Corrupt database detected; purging and retrying…", err);
          setStatus("Recovering database…");
          await purgeDatabase();
          return init(true);
        }

        const msg = err instanceof Error ? err.message : String(err);
        console.error("[CharcoalDb] Failed to open database:", err);
        setError(msg);
      }
    }

    void init();
    return () => { cancelled = true; };
  }, []);

  if (!value.ready) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-3 bg-background">
        {error ? (
          <>
            <p className="font-mono text-xs text-danger-text">Database error</p>
            <p className="max-w-xs text-center font-mono text-xs text-muted-foreground">{error}</p>
          </>
        ) : (
          <>
            {/* Animated spinner */}
            <svg
              className="h-6 w-6 animate-spin text-muted-foreground"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              role="presentation"
              aria-hidden="true"
            >
              <circle
                className="opacity-25"
                cx="12" cy="12" r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            <p className="font-mono text-xs text-muted-foreground">{status}</p>
          </>
        )}
      </div>
    );
  }

  return <DbContext.Provider value={value}>{children}</DbContext.Provider>;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

// eslint-disable-next-line react-refresh/only-export-components
export function useDb(): CharcoalDb {
  const ctx = useContext(DbContext);
  if (!ctx.ready) throw new Error("useDb() called before database is ready");
  return ctx.db;
}
