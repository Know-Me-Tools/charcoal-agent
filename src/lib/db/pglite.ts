import { PGlite } from "@electric-sql/pglite";
import type { ContentBlock, RichMessage } from "@/types/chat-content";
import type { LocalThread } from "@/types";

// ---------------------------------------------------------------------------
// Module-level singleton — set once by DbProvider, consumed by stores
// ---------------------------------------------------------------------------

let _instance: CharcoalDb | null = null;

export function setDbInstance(db: CharcoalDb): void {
  _instance = db;
}

/** Returns the initialized CharcoalDb. Throws if called before DbProvider is ready. */
export function getDbInstance(): CharcoalDb {
  if (!_instance) throw new Error("[CharcoalDb] Database not yet initialized");
  return _instance;
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
];

// ---------------------------------------------------------------------------
// Row shapes returned from PGlite queries
// ---------------------------------------------------------------------------

interface ThreadRow {
  id: string;
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
      "SELECT id, title, agent_id, agent_name, is_ephemeral, created_at, updated_at FROM threads ORDER BY updated_at DESC",
    );
    return rows.map(rowToThread);
  }

  async upsertThread(thread: LocalThread): Promise<void> {
    await this.db.query(
      `INSERT INTO threads (id, title, is_ephemeral, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (id) DO UPDATE
         SET title        = EXCLUDED.title,
             is_ephemeral = EXCLUDED.is_ephemeral,
             updated_at   = EXCLUDED.updated_at`,
      [thread.id, thread.title, thread.isEphemeral, thread.createdAt, thread.updatedAt],
    );
  }

  async deleteThread(id: string): Promise<void> {
    await this.db.query("DELETE FROM threads WHERE id = $1", [id]);
  }

  async touchThread(id: string): Promise<void> {
    const now = new Date().toISOString();
    await this.db.query(
      "UPDATE threads SET updated_at = $1 WHERE id = $2",
      [now, id],
    );
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
    title: row.title,
    isEphemeral: row.is_ephemeral,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
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
