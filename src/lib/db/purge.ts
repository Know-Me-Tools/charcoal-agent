import { PGDATA_URL } from "@/lib/db/pglite";

/**
 * The IndexedDB database name PGlite (0.3.15) opens for our data-dir URL.
 * Derived from the installed library source:
 *  - `dist/index.js` parses `idb://…` by stripping the scheme (`e.slice(6)`
 *    in `Ge`), giving dataDir `charcoal-db`;
 *  - `IdbFs.init` (same file) mounts Emscripten's IDBFS at
 *    `/pglite/${dataDir}` — mountpoint `/pglite/charcoal-db`;
 *  - `dist/pglite.js` IDBFS `syncfs` calls `getDB(mount.mountpoint)`, which
 *    calls `indexedDB.open(name, DB_VERSION)` with that mountpoint verbatim.
 * IDBFS creates exactly one database under that name with one object store
 * (`FILE_DATA`); there is no second database or prefix scheme to handle.
 * Verified by `purge.test.ts`, which derives the name from the library's
 * exported `IdbFs` rather than trusting this derivation.
 */
export function pgliteIdbName(): string {
  const scheme = "idb://";
  const dataDir = PGDATA_URL.startsWith(scheme)
    ? PGDATA_URL.slice(scheme.length)
    : PGDATA_URL;
  return `/pglite/${dataDir}`;
}

/** Shown when another tab or a still-open connection holds the database. */
export const PURGE_BLOCKED_MESSAGE =
  "The local database is open in another tab. Close other KnowMe tabs and reload.";

const PURGE_BLOCKED_TIMEOUT_MS = 3000;

/**
 * Delete the PGLite IndexedDB and return once the delete completes.
 *
 * A delete blocked by another open connection (typically a second KnowMe
 * tab) never fires `onsuccess`; the caller's retry open would queue behind
 * the pending delete and the app would sit on its start-up spinner forever.
 * A delete that stays blocked for more than `PURGE_BLOCKED_TIMEOUT_MS`
 * therefore rejects with `PURGE_BLOCKED_MESSAGE` so the caller can fail
 * visibly, while a delete that succeeds after a shorter block still
 * resolves.
 */
export function purgeDatabase(): Promise<void> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.deleteDatabase(pgliteIdbName());
    let blockedTimer: ReturnType<typeof setTimeout> | undefined;
    const cancelBlockedTimer = () => {
      if (blockedTimer !== undefined) clearTimeout(blockedTimer);
    };
    req.onsuccess = () => {
      cancelBlockedTimer();
      resolve();
    };
    req.onerror = () => {
      cancelBlockedTimer();
      reject(
        req.error instanceof Error
          ? req.error
          : new Error(`Failed to delete the local database: ${String(req.error)}`),
      );
    };
    req.onblocked = () => {
      if (blockedTimer !== undefined) return;
      blockedTimer = setTimeout(() => {
        reject(new Error(PURGE_BLOCKED_MESSAGE));
      }, PURGE_BLOCKED_TIMEOUT_MS);
    };
  });
}
