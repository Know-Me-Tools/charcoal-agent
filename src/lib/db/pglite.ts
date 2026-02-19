import { PGlite } from "@electric-sql/pglite";

let dbInstance: PGlite | null = null;
let initPromise: Promise<PGlite> | null = null;

const SCHEMA_SQL = `
  CREATE TABLE IF NOT EXISTS threads (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    agent_id TEXT NOT NULL,
    agent_name TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
  );

  CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    thread_id TEXT NOT NULL,
    role TEXT NOT NULL,
    content JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );

  CREATE INDEX IF NOT EXISTS idx_messages_thread_id ON messages(thread_id);
  CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(thread_id, created_at);

  CREATE TABLE IF NOT EXISTS user_config (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL
  );
`;

export async function getDb(): Promise<PGlite> {
  if (dbInstance) return dbInstance;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const db = new PGlite("idb://knowme-db");
    await db.exec(SCHEMA_SQL);
    dbInstance = db;
    return db;
  })();

  return initPromise;
}

export function resetDb(): void {
  dbInstance = null;
  initPromise = null;
}
