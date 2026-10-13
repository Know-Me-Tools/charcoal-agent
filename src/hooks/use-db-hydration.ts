/**
 * useDbHydration
 *
 * Runs once after DbProvider has initialized CharcoalDb.
 * Reads all threads from PGLite and hydrates the thread-registry store.
 */
import { useEffect } from "react";
import { useDb } from "@/lib/db/use-db";
import { useThreadRegistryStore } from "@/stores/thread-registry-store";

export function useDbHydration() {
  const db = useDb();
  const initFromDb = useThreadRegistryStore((s) => s.initFromDb);

  useEffect(() => {
    db.getThreads()
      .then((threads) => {
        initFromDb(threads);
      })
      .catch(() => {
        // A failed read must not leave thread routes waiting forever.
        initFromDb([]);
      });
    // Run only once on mount — db reference is stable (singleton)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
