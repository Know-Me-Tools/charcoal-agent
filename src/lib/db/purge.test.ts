import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { IdbFs, type PGlite } from "@electric-sql/pglite";
import { PGDATA_URL } from "@/lib/db/pglite";
import { PURGE_BLOCKED_MESSAGE, purgeDatabase } from "@/lib/db/purge";

type EmscriptenMod = Parameters<
  NonNullable<
    Awaited<ReturnType<IdbFs["init"]>>["emscriptenOpts"]["preRun"]
  >[number]
>[0];

/**
 * Ask the installed PGlite library itself which mountpoint its IdbFs mounts
 * Emscripten's IDBFS on for our data dir. IDBFS opens an IndexedDB database
 * named exactly that mountpoint (dist/pglite.js: `syncfs` calls
 * `getDB(mount.mountpoint)`, which calls `indexedDB.open(name, DB_VERSION)`),
 * so this is the name a purge must delete. Deriving it from the library —
 * instead of hard-coding a string — means this test fails if a PGlite
 * upgrade changes the naming scheme.
 */
async function libraryIndexedDbName(dataDir: string): Promise<string> {
  const fs = new IdbFs(dataDir);
  const { emscriptenOpts } = await fs.init({} as unknown as PGlite, {});
  let mountpoint = "";
  const fakeMod = {
    FS: {
      filesystems: { IDBFS: {} },
      mkdir: () => {},
      mount: (_fs: unknown, _opts: unknown, path: string) => {
        mountpoint = path;
      },
      symlink: () => {},
    },
  };
  for (const fn of emscriptenOpts.preRun ?? []) {
    fn(fakeMod as unknown as EmscriptenMod);
  }
  return mountpoint;
}

function makeFakeIndexedDB() {
  const deletedNames: string[] = [];
  const fake = {
    deleteDatabase(name: string) {
      deletedNames.push(name);
      const request: {
        onsuccess: (() => void) | null;
        onerror: (() => void) | null;
        onblocked: (() => void) | null;
      } = { onsuccess: null, onerror: null, onblocked: null };
      queueMicrotask(() => request.onsuccess?.());
      return request;
    },
  };
  return { fake, deletedNames };
}

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("purgeDatabase", () => {
  it("deletes the exact IndexedDB database PGlite opens for PGDATA_URL", async () => {
    const { fake, deletedNames } = makeFakeIndexedDB();
    vi.stubGlobal("indexedDB", fake);

    await purgeDatabase();

    // dataDir as the library parses it from the URL (dist/index.js: strip
    // the "idb://" scheme), then the name the library itself mounts IDBFS on.
    const dataDir = PGDATA_URL.slice("idb://".length);
    const expectedName = await libraryIndexedDbName(dataDir);
    expect(expectedName).not.toBe("");
    expect(deletedNames).toEqual([expectedName]);
  });
});

type FakeDeleteRequest = {
  onsuccess: (() => void) | null;
  onerror: (() => void) | null;
  onblocked: (() => void) | null;
  error: Error | null;
};

/** Fake indexedDB whose delete requests the test drives by hand. */
function makeControllableFakeIndexedDB() {
  const requests: FakeDeleteRequest[] = [];
  const fake = {
    deleteDatabase(_name: string) {
      const request: FakeDeleteRequest = {
        onsuccess: null,
        onerror: null,
        onblocked: null,
        error: null,
      };
      requests.push(request);
      return request;
    },
  };
  return { fake, requests };
}

describe("purgeDatabase blocked handling", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it("resolves when the delete succeeds", async () => {
    const { fake, requests } = makeControllableFakeIndexedDB();
    vi.stubGlobal("indexedDB", fake);

    const promise = purgeDatabase();
    requests[0].onsuccess?.();

    await expect(promise).resolves.toBeUndefined();
  });

  it("resolves when the delete is blocked but succeeds within 3 seconds", async () => {
    const { fake, requests } = makeControllableFakeIndexedDB();
    vi.stubGlobal("indexedDB", fake);

    const promise = purgeDatabase();
    requests[0].onblocked?.();
    vi.advanceTimersByTime(2999);
    requests[0].onsuccess?.();

    await expect(promise).resolves.toBeUndefined();
  });

  it("rejects with a clear message when the delete stays blocked for over 3 seconds", async () => {
    const { fake, requests } = makeControllableFakeIndexedDB();
    vi.stubGlobal("indexedDB", fake);

    const promise = purgeDatabase();
    const assertion = expect(promise).rejects.toThrow(PURGE_BLOCKED_MESSAGE);
    requests[0].onblocked?.();
    vi.advanceTimersByTime(3001);

    await assertion;
  });

  it("rejects when the delete reports an error", async () => {
    const { fake, requests } = makeControllableFakeIndexedDB();
    vi.stubGlobal("indexedDB", fake);

    const promise = purgeDatabase();
    const assertion = expect(promise).rejects.toThrow("delete failed");
    requests[0].error = new Error("delete failed");
    requests[0].onerror?.();

    await assertion;
  });
});
