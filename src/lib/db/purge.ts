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

/** Delete the PGLite IndexedDB and return once complete (or after timeout). */
export function purgeDatabase(): Promise<void> {
  return new Promise((resolve) => {
    const req = indexedDB.deleteDatabase(pgliteIdbName());
    req.onsuccess = () => resolve();
    req.onerror = () => resolve(); // best-effort; proceed regardless
    req.onblocked = () => resolve();
    // Fallback in case the event never fires
    setTimeout(resolve, 2000);
  });
}
