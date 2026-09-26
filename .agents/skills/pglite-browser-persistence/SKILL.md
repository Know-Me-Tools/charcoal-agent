---
name: pglite-browser-persistence
description: Field-tested rules for running PGlite (Postgres in WASM, @electric-sql/pglite) as a browser database on IndexedDB in a Vite app. Covers Vite pre-bundling breaking PGlite ("Invalid FS bundle size"), `idb://` database naming, what a resolved query guarantees under `relaxedDurability`, purge-and-retry when storage is corrupt, versioned migrations, and running a real in-memory PGlite in vitest or jsdom. Use this skill whenever a project uses PGlite or `idb://` data directories, or hits PGlite startup, persistence or test errors such as "Invalid FS bundle size". For browser-storage durability in general (any engine) use durable-browser-writes instead.
license: MIT
compatibility: "@electric-sql/pglite 0.3.x in the browser (Vite 5+). The vitest pattern needs vitest with jsdom or node."
metadata:
  origin: "KnowMe AI web client, complete-rebranding phase, 2026-09"
  evidence: "each rule records how it was verified in the origin project"
---

# PGlite in the browser

PGlite gives you real Postgres in the page, persisted to IndexedDB. Most of the pain is not SQL. It comes from how the WASM assets load, what "the write finished" actually means, and how to test it. **Evidence tags** on each rule: `[verified]` = a failing-then-passing test, a reproduced error or a mutation proof in the origin project; `[docs]` = upstream documentation; `[review]` = found by independent review, fix designed but not yet proven here; `[practice]` = a working convention, not independently tested. Re-check anything version-sensitive against your own versions.

## 1. Keep PGlite out of Vite's dependency pre-bundling `[verified]`

**Symptom:** the app fails at startup with `Invalid FS bundle size: 661 !== 4939170` (the numbers vary).
**Cause:** PGlite loads its `.data` and `.wasm` files with `new URL(..., import.meta.url)`. Pre-bundling moves the JS into `node_modules/.vite/deps`, so those URLs resolve to files that aren't there, and the server answers with a small HTML or 404 body. PGlite reads that body as the filesystem bundle and the size check fails.

```ts
// vite.config.ts
export default defineConfig({
  optimizeDeps: { exclude: ["@electric-sql/pglite"] },
});
```

The same error also appears when the dev server refuses to serve the asset. One case is a project copy with a symlinked `node_modules` that sits outside the Vite root. Add the real path to `server.fs.allow` there. See `references/troubleshooting.md`.

## 2. `idb://name` creates an IndexedDB database called `/name` `[practice]`

`new PGlite("idb://app-db")` stores the data in an IndexedDB database named `/app-db`, with a leading slash. Any code that deletes or inspects the database directly (`indexedDB.deleteDatabase`, DevTools, purge logic) has to use the slashed name. Otherwise it quietly does nothing.

## 3. Know what a resolved write guarantees `[docs]`

The PGlite docs (`docs/filesystems.md`) say the IndexedDB filesystem flushes changed files "after each query". With `relaxedDurability: true`, "the results of a query are returned immediately, and the flush to IndexedDB is scheduled … asynchronously".

- **`relaxedDurability` off (the default):** an awaited `query`/`exec` means the data is in IndexedDB. You can build on that. "Await the write, then tell the user it's saved" is honest.
- **`relaxedDurability` on:** writes are faster, but a resolved promise proves nothing about disk. A reload right after can lose the write.

Write down which mode you rely on, in a comment next to the `new PGlite(...)` call, and cite the doc. An upgrade could change this behaviour silently, and nothing else would flag it.

Even in the default mode, nothing can make a write finish during page unload. IndexedDB is asynchronous and the page won't wait for it. If writes must survive a reload that happens mid-write, see the `durable-browser-writes` skill (a synchronous page-exit journal).

## 4. Recover from corrupt storage once, then stop `[practice]`

A partially written or version-mismatched IndexedDB store can make every start fail. Handle it at the database provider, but **rule out configuration first**. "Invalid FS bundle size" is also what a mis-served asset produces (rule 1), and purging then deletes a user's data for a bug in your build.

1. Before purging, confirm the WASM and `.data` assets load: the right status, the right size, not an HTML body. Only when the assets are fine and opening still fails is the store the suspect. Log both facts.
2. Delete the IndexedDB database using the name from rule 2. Where losing local data matters, export or keep a copy of the raw store before deleting it.
3. Treat the delete as finished on `success`, `error`, `blocked`, or a short timeout (about 2s). A `blocked` delete never fires `success` while another tab holds the database open.
4. Reopen **once**. If that fails too, show a real error screen with plain-language text. Never loop.
5. After a purge, **discard** any pending-write journal instead of replaying it into the empty database, and tell the user that local history was reset.

## 5. Migrations: append-only, versioned, idempotent `[practice]`

- Keep migrations as an ordered array of `{ version, sql }` and track the applied ones in a `schema_migrations` table.
- Never edit a migration that has shipped. Add a new one. Users' databases already ran the old SQL.
- Run each migration's DDL and its `schema_migrations` insert in **one transaction**, so a crash can't leave the DDL applied but unrecorded.
- Still make each step safe to re-run (`CREATE TABLE IF NOT EXISTS`, `DO $$ ... IF NOT EXISTS ... $$`), because a crash between the DDL and recording the version will run it again.
- Put `ON CONFLICT (id) DO UPDATE` on upserts from the start. Idempotent writes are what make replay and retry safe later.

## 6. `TIMESTAMPTZ` comes back as a `Date`, not a string `[verified]`

Query results parse `timestamptz` into JavaScript `Date` objects. Comparing one with an ISO string (`row.updated_at < "2026-09-26T…"`) coerces to `NaN`, and every comparison is `false`, silently. In the origin project that made a "newer write wins" guard never fire, so older titles overwrote newer ones. Normalise at the boundary (`new Date(v).toISOString()`, or compare `getTime()` values), and cover it with a test on real PGlite. A fake store that returns strings hides it.

## 7. Test against a real in-memory PGlite `[verified]`

Don't mock the database for ordering, foreign-key or upsert behaviour. A fake store hides exactly the bugs that matter, such as a missing `ON CONFLICT` or a write that races a foreign key. PGlite runs in memory under vitest, jsdom included:

```ts
vi.mock("@electric-sql/pglite", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@electric-sql/pglite")>();
  class InMemoryPGlite extends actual.PGlite {
    constructor(dataDirOrOptions?: string | object, options?: object) {
      // Ignore the idb:// dataDir and run in memory; keep the options in either call form.
      const opts = typeof dataDirOrOptions === "object" ? { ...dataDirOrOptions, dataDir: undefined } : options;
      super(opts);
    }
  }
  return { ...actual, PGlite: InMemoryPGlite };
});
```

Your real open and migration code then runs unchanged: real schema, real constraints, real SQL. Startup costs about 1–6 s per fresh instance, so share one instance per file and reset tables between tests. The limit: this does not exercise the IndexedDB layer. Cover persistence across reloads with a browser test. The full recipe and its pitfalls are in `references/vitest-in-memory.md`.

## Where to go next

- `references/troubleshooting.md`: the errors seen with PGlite and their causes.
- `references/vitest-in-memory.md`: the full in-memory test setup, how to prove the tests can fail, and what they don't cover.
- For queued writes, the page-exit journal, replay and multi-tab safety, see the `durable-browser-writes` skill.
