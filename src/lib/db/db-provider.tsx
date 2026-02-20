import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { CharcoalDb, setDbInstance } from "@/lib/db/pglite";

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

type DbContextValue =
  | { ready: false; db: null }
  | { ready: true; db: CharcoalDb };

const DbContext = createContext<DbContextValue>({ ready: false, db: null });

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
    CharcoalDb.open((msg) => {
      if (!cancelled) setStatus(msg);
    })
      .then((db) => {
        if (!cancelled) {
          setDbInstance(db);
          setValue({ ready: true, db });
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          const msg = err instanceof Error ? err.message : String(err);
          console.error("[CharcoalDb] Failed to open database:", err);
          setError(msg);
        }
      });
    return () => { cancelled = true; };
  }, []);

  if (!value.ready) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-3 bg-background">
        {error ? (
          <>
            <p className="font-mono text-xs text-destructive">Database error</p>
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
