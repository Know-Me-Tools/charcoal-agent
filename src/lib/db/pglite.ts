import { PGlite } from "@electric-sql/pglite";
import type { ContentBlock, RichMessage } from "@/types/chat-content";
import type { LocalThread } from "@/types";

// ---------------------------------------------------------------------------
// Module-level singleton — set once by DbProvider, consumed by stores
// ---------------------------------------------------------------------------

let _instance: CharcoalDb | null = null;
let readyResolve: ((db: CharcoalDb) => void) | null = null;
const readyPromise: Promise<CharcoalDb> = new Promise((resolve) => {
  readyResolve = resolve;
});

export function setDbInstance(db: CharcoalDb): void {
  _instance = db;
  readyResolve?.(db);
  readyResolve = null;
}

/** Returns the initialized CharcoalDb. Throws if called before DbProvider is ready. */
export function getDbInstance(): CharcoalDb {
  if (!_instance) throw new Error("[CharcoalDb] Database not yet initialized");
  return _instance;
}

/**
 * Resolves once the database is open — immediately if it already is,
 * otherwise the first time `setDbInstance` is called. Lets the write queue
 * (`src/lib/db/write-queue.ts`) wait for readiness instead of silently
 * dropping a write that reaches it before `DbProvider` finishes opening
 * (chat-persistence-durability task 1.2).
 */
export function whenDbReady(): Promise<CharcoalDb> {
  if (_instance) return Promise.resolve(_instance);
  return readyPromise;
}

// ---------------------------------------------------------------------------
// Schema migrations
// ---------------------------------------------------------------------------

interface Migration {
  version: number;
  name: string;
  up: string;
}

const MIGRATIONS: Migration[] = [
  {
    version: 1,
    name: "initial_schema",
    up: `
      CREATE TABLE IF NOT EXISTS threads (
        id           TEXT        PRIMARY KEY,
        title        TEXT        NOT NULL DEFAULT 'New conversation',
        agent_id     TEXT,
        agent_name   TEXT,
        is_ephemeral BOOLEAN     NOT NULL DEFAULT TRUE,
        created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS messages (
        id         TEXT        PRIMARY KEY,
        thread_id  TEXT        NOT NULL REFERENCES threads(id) ON DELETE CASCADE,
        role       TEXT        NOT NULL CHECK (role IN ('user','assistant','system')),
        content    JSONB       NOT NULL DEFAULT '[]',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        status     TEXT        NOT NULL DEFAULT 'complete'
      );

      CREATE INDEX IF NOT EXISTS idx_messages_thread_id  ON messages(thread_id);
      CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(thread_id, created_at);

      CREATE TABLE IF NOT EXISTS user_config (
        key   TEXT PRIMARY KEY,
        value JSONB NOT NULL
      );
    `,
  },
  {
    version: 2,
    name: "ensure_agent_columns",
    up: `
      -- Add agent_id and agent_name if they were missed in v1 (idempotent ADD COLUMN IF NOT EXISTS).
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'threads' AND column_name = 'agent_id'
        ) THEN
          ALTER TABLE threads ADD COLUMN agent_id TEXT;
        END IF;
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'threads' AND column_name = 'agent_name'
        ) THEN
          ALTER TABLE threads ADD COLUMN agent_name TEXT;
        END IF;
      END $$;
    `,
  },
  {
    version: 3,
    name: "add_session_id",
    up: `
      -- Add an explicit session_id column so the UAR session UUID is stored
      -- alongside the thread and is unambiguously recoverable after a restart.
      -- For all existing threads session_id equals id (they were always the same).
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'threads' AND column_name = 'session_id'
        ) THEN
          ALTER TABLE threads ADD COLUMN session_id TEXT;
          UPDATE threads SET session_id = id WHERE session_id IS NULL;
          ALTER TABLE threads ALTER COLUMN session_id SET NOT NULL;
          CREATE UNIQUE INDEX IF NOT EXISTS idx_threads_session_id ON threads(session_id);
        END IF;
      END $$;
    `,
  },
];

// ---------------------------------------------------------------------------
// Row shapes returned from PGlite queries
// ---------------------------------------------------------------------------

interface ThreadRow {
  id: string;
  session_id: string;
  title: string;
  agent_id: string | null;
  agent_name: string | null;
  is_ephemeral: boolean;
  created_at: string;
  updated_at: string;
}

interface MessageRow {
  id: string;
  thread_id: string;
  role: "user" | "assistant" | "system";
  content: ContentBlock[] | string; // PGlite may return JSONB already parsed or as string
  created_at: string;
  status: string;
}

// ---------------------------------------------------------------------------
// CharcoalDb — thin typed wrapper around PGlite
// ---------------------------------------------------------------------------

export class CharcoalDb {
  private constructor(private readonly db: PGlite) {}

  // ---- lifecycle ----------------------------------------------------------

  static async open(
    onStatus?: (message: string) => void,
  ): Promise<CharcoalDb> {
    onStatus?.("Opening database…");
    // Durability assumption (chat-persistence-durability design decision 8):
    // the write queue (src/lib/db/write-queue.ts) treats a resolved
    // query()/exec() promise as "the write reached IndexedDB". That only
    // holds while `relaxedDurability` is unset here. Per the upstream docs
    // (PGlite `docs/docs/filesystems.md`, Context7 `/electric-sql/pglite`):
    // the IndexedDB filesystem flushes to IndexedDB "after each query", and
    // with `relaxedDurability` enabled, "results ... are returned
    // immediately, and the flush to the IndexedDB ... is scheduled ... to
    // happen asynchronously" — i.e. without it (the default, and our
    // setting), a query's promise does not resolve until that flush has
    // completed. Do not add `relaxedDurability: true` without re-deriving
    // the write queue's completion guarantees in
    // openspec/changes/chat-persistence-durability/design.md.
    const db = new PGlite("idb://charcoal-db");
    const instance = new CharcoalDb(db);
    await instance.runMigrations(onStatus);
    await instance.migrateFromLocalStorage(onStatus);
    return instance;
  }

  private async runMigrations(
    onStatus?: (message: string) => void,
  ): Promise<void> {
    onStatus?.("Bootstrapping schema migrations…");
    // Bootstrap migration table
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version    INTEGER     PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    for (const m of MIGRATIONS) {
      const { rows } = await this.db.query<{ version: number }>(
        "SELECT version FROM schema_migrations WHERE version = $1",
        [m.version],
      );
      if (rows.length === 0) {
        onStatus?.(`Applying migration v${m.version}: ${m.name}…`);
        await this.db.exec(m.up);
        await this.db.query(
          "INSERT INTO schema_migrations (version) VALUES ($1)",
          [m.version],
        );
      }
    }
    onStatus?.("Schema up to date.");
  }

  /** One-time migration of any data previously stored in localStorage. */
  private async migrateFromLocalStorage(
    onStatus?: (message: string) => void,
  ): Promise<void> {
    const flag = "charcoal-pglite-migrated-v1";
    if (localStorage.getItem(flag)) return;

    onStatus?.("Migrating data from local storage…");

    // Migrate thread registry
    const rawRegistry = localStorage.getItem("charcoal-thread-registry");
    if (rawRegistry) {
      try {
        const parsed = JSON.parse(rawRegistry) as { state?: { threads?: Record<string, LocalThread> } };
        const threads = parsed.state?.threads ?? {};
        const count = Object.keys(threads).length;
        if (count > 0) {
          onStatus?.(`Importing ${count} thread${count === 1 ? "" : "s"}…`);
          for (const t of Object.values(threads)) {
            await this.upsertThread(t).catch(() => { /* skip invalid rows */ });
          }
        }
      } catch { /* ignore parse errors */ }
    }

    // Migrate message store
    const rawMessages = localStorage.getItem("charcoal-chat-messages");
    if (rawMessages) {
      try {
        const parsed = JSON.parse(rawMessages) as { state?: { messagesByThread?: Record<string, RichMessage[]> } };
        const byThread = parsed.state?.messagesByThread ?? {};
        const threadIds = Object.keys(byThread);
        if (threadIds.length > 0) {
          onStatus?.(`Importing messages for ${threadIds.length} thread${threadIds.length === 1 ? "" : "s"}…`);
          for (const [threadId, msgs] of Object.entries(byThread)) {
            // Ensure thread exists before inserting messages
            const exists = await this.db.query<{ id: string }>(
              "SELECT id FROM threads WHERE id = $1",
              [threadId],
            );
            if (exists.rows.length === 0) continue;
            for (const msg of msgs) {
              await this.insertMessage(threadId, msg).catch(() => { /* skip duplicates */ });
            }
          }
        }
      } catch { /* ignore parse errors */ }
    }

    // Clean up localStorage keys that are now superseded
    localStorage.removeItem("charcoal-thread-registry");
    localStorage.removeItem("charcoal-chat-messages");
    localStorage.setItem(flag, "1");
    onStatus?.("Migration complete.");
  }

  // ---- threads ------------------------------------------------------------

  async getThreads(): Promise<LocalThread[]> {
    const { rows } = await this.db.query<ThreadRow>(
      "SELECT id, session_id, title, agent_id, agent_name, is_ephemeral, created_at, updated_at FROM threads ORDER BY updated_at DESC",
    );
    return rows.map(rowToThread);
  }

  async upsertThread(thread: LocalThread): Promise<void> {
    // session_id is always the same UUID as id — stored explicitly so it can
    // be read back after a restart without relying on the URL or in-memory state.
    const sessionId = thread.sessionId ?? thread.id;
    await this.db.query(
      `INSERT INTO threads (id, session_id, title, agent_id, agent_name, is_ephemeral, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (id) DO UPDATE
         SET session_id   = EXCLUDED.session_id,
             title        = EXCLUDED.title,
             agent_id     = EXCLUDED.agent_id,
             agent_name   = EXCLUDED.agent_name,
             is_ephemeral = EXCLUDED.is_ephemeral,
             updated_at   = EXCLUDED.updated_at`,
      [
        thread.id,
        sessionId,
        thread.title,
        thread.agentId ?? null,
        thread.agentName ?? null,
        thread.isEphemeral,
        thread.createdAt,
        thread.updatedAt,
      ],
    );
  }

  async deleteThread(id: string): Promise<void> {
    await this.db.query("DELETE FROM threads WHERE id = $1", [id]);
  }

  async touchThread(id: string, at?: string): Promise<void> {
    const touchedAt = at ?? new Date().toISOString();
    await this.db.query(
      "UPDATE threads SET updated_at = $1 WHERE id = $2",
      [touchedAt, id],
    );
  }

  /**
   * The stored `updated_at` for one thread, as an ISO string, or `null` when
   * it no longer exists. Used by cross-tab journal replay
   * (`persistence-journal.ts`) to decide whether a dead tab's
   * `upsertThread`/`touchThread` descriptor is stale or targets a thread
   * that was deleted since that tab's journal was written
   * (chat-persistence-durability operator decision 2026-09-26).
   *
   * PGlite returns a `TIMESTAMPTZ` column as a native `Date`, not a string —
   * confirmed by a real-PGlite test failing without this normalization: an
   * older descriptor's ISO-string `updatedAt` compared with `<` against a
   * `Date` coerces the string to `NaN`, so the comparison is always false
   * and a stale write is silently applied instead of skipped. Normalize
   * here so callers can always compare ISO strings.
   */
  async getThreadUpdatedAt(id: string): Promise<string | null> {
    const { rows } = await this.db.query<{ updated_at: string | Date }>(
      "SELECT updated_at FROM threads WHERE id = $1",
      [id],
    );
    const value = rows[0]?.updated_at;
    if (value === undefined) return null;
    return value instanceof Date ? value.toISOString() : value;
  }

  // ---- messages -----------------------------------------------------------

  async getMessages(threadId: string): Promise<RichMessage[]> {
    const { rows } = await this.db.query<MessageRow>(
      "SELECT id, thread_id, role, content, created_at, status FROM messages WHERE thread_id = $1 ORDER BY created_at ASC",
      [threadId],
    );
    return rows.map(rowToMessage);
  }

  async insertMessage(threadId: string, msg: RichMessage): Promise<void> {
    await this.db.query(
      `INSERT INTO messages (id, thread_id, role, content, created_at, status)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (id) DO UPDATE
         SET content = EXCLUDED.content,
             status  = EXCLUDED.status`,
      [
        msg.id,
        threadId,
        msg.role,
        JSON.stringify(msg.content),
        msg.createdAt instanceof Date ? msg.createdAt.toISOString() : msg.createdAt,
        msg.status ?? "complete",
      ],
    );
  }

  async deleteThreadMessages(threadId: string): Promise<void> {
    await this.db.query("DELETE FROM messages WHERE thread_id = $1", [threadId]);
  }

  /**
   * Deletes specific message rows (e.g. a superseded turn dropped by a
   * retry or regenerate) so they don't resurrect on the next hydration.
   * No-op when `messageIds` is empty.
   */
  async deleteMessages(threadId: string, messageIds: string[]): Promise<void> {
    if (messageIds.length === 0) return;
    await this.db.query(
      "DELETE FROM messages WHERE thread_id = $1 AND id = ANY($2)",
      [threadId, messageIds],
    );
  }

  // ---- user_config --------------------------------------------------------

  async getConfig(key: string): Promise<unknown | null> {
    const { rows } = await this.db.query<{ value: unknown }>(
      "SELECT value FROM user_config WHERE key = $1",
      [key],
    );
    return rows[0]?.value ?? null;
  }

  async setConfig(key: string, value: unknown): Promise<void> {
    await this.db.query(
      `INSERT INTO user_config (key, value) VALUES ($1, $2)
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
      [key, JSON.stringify(value)],
    );
  }
}

// ---------------------------------------------------------------------------
// Row → domain type converters
// ---------------------------------------------------------------------------

function rowToThread(row: ThreadRow): LocalThread {
  return {
    id: row.id,
    // session_id equals id by convention; fall back to id for rows written
    // before migration v3 (though the migration back-fills them).
    sessionId: row.session_id ?? row.id,
    title: row.title,
    isEphemeral: row.is_ephemeral,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    agentId: row.agent_id ?? undefined,
    agentName: row.agent_name ?? undefined,
  };
}

function rowToMessage(row: MessageRow): RichMessage {
  let content: ContentBlock[];
  if (typeof row.content === "string") {
    try { content = JSON.parse(row.content) as ContentBlock[]; }
    catch { content = []; }
  } else {
    content = row.content as ContentBlock[];
  }
  return {
    id: row.id,
    role: row.role,
    content,
    createdAt: new Date(row.created_at),
    status: (row.status as RichMessage["status"]) ?? "complete",
  };
}
