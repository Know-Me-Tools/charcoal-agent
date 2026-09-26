# PGlite troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| `Invalid FS bundle size: N !== M` at startup, N small (hundreds of bytes) | The `.data` asset request returned an HTML or error page. Usually Vite pre-bundled PGlite, or the dev server refused a path outside its root (a symlinked `node_modules` in a copied tree). | Add `optimizeDeps.exclude: ["@electric-sql/pglite"]`. In copies with a symlinked `node_modules`, add `server: { fs: { allow: [".", "<real node_modules path>"] } }`. Clear `node_modules/.vite` after changing either. |
| Same error only on some users' machines, persisting across reloads, with the assets loading correctly (right status and size) | The IndexedDB store is corrupt or from an incompatible build | Confirm the assets first. Then purge once and reopen (SKILL.md §4), and discard any pending-write journal after the purge. Never purge while the asset check fails: that is a build bug. |
| `indexedDB.deleteDatabase("app-db")` does nothing | The database is named `/app-db` | Use the leading slash (SKILL.md §2). |
| Delete hangs forever | Another tab has the database open, so the request is `blocked` | Resolve on `blocked` and on a timeout as well as `success`/`error`. |
| Data written just before a reload is missing | `relaxedDurability: true`, or a write that was never awaited (fire-and-forget `.catch(console.error)`) | Await writes in the default durability mode, and add a page-exit journal (the `durable-browser-writes` skill). |
| A test passes against a fake store but the app loses or duplicates rows | The fake ignores foreign keys, `ON CONFLICT` or ordering | Test on real in-memory PGlite (`vitest-in-memory.md`). |
| vitest: `Cannot read properties of undefined (reading 'clear')` on `localStorage` in tests around PGlite code | Node 25+ defines its own global `localStorage`, which shadows jsdom's | Run the suite on Node 24 LTS, or start Node with `--localstorage-file`. Pin the version (`.nvmrc`, `engines`). |
