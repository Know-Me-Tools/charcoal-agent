---
paths: ['src/lib/db/**', 'src/stores/thread-registry-store.ts', 'src/hooks/use-db-hydration.ts']
---

# Local persistence

Loaded when a matching file is read. Moved from CLAUDE.md to keep resident context small.

- `lib/db/pglite.ts` — `CharcoalDb`, a PGlite (Postgres-in-WASM on IndexedDB `/charcoal-db`) wrapper with an inline versioned `MIGRATIONS` array (tables: `threads`, `messages` with JSONB content, `user_config`). Add schema changes as a new migration entry; don't edit old ones.
- `DbProvider` initializes it and registers a module singleton; stores call `getDbInstance()` for write-through (throws if used before the provider is ready).
- `stores/thread-registry-store.ts` is the source of truth for threads. Threads start **ephemeral** (hidden from sidebar) and are promoted via `markPersisted` after the first successful send. `use-db-hydration` loads them on startup.
- Rule of thumb: UAR owns agents/providers/skills/sessions (entity graph); the browser owns thread registry and rendered message history (Zustand + PGlite).
