import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { PGlite } from "@electric-sql/pglite";
import { getDb } from "./pglite";

interface DbContextValue {
  db: PGlite | null;
  isReady: boolean;
  error: Error | null;
}

const DbContext = createContext<DbContextValue>({
  db: null,
  isReady: false,
  error: null,
});

export function DbProvider({ children }: { children: ReactNode }) {
  const [db, setDb] = useState<PGlite | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;
    getDb()
      .then((instance) => {
        if (!cancelled) {
          setDb(instance);
          setIsReady(true);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error(String(err)));
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <DbContext.Provider value={{ db, isReady, error }}>
      {children}
    </DbContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useDbContext(): DbContextValue {
  return useContext(DbContext);
}
