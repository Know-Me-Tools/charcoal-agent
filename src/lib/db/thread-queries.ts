import type { Thread } from "@/types";
import { getDb } from "./pglite";

interface ThreadRow {
  id: string;
  title: string;
  agent_id: string;
  agent_name: string | null;
  created_at: string;
  updated_at: string;
}

function rowToThread(row: ThreadRow): Thread {
  return {
    id: row.id,
    title: row.title,
    agent_id: row.agent_id,
    agent_name: row.agent_name ?? undefined,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export async function getAllThreads(): Promise<Thread[]> {
  const db = await getDb();
  const result = await db.query<ThreadRow>(
    "SELECT * FROM threads ORDER BY updated_at DESC NULLS LAST",
  );
  return result.rows.map(rowToThread);
}

export async function upsertThread(thread: Thread): Promise<void> {
  const db = await getDb();
  await db.query(
    `INSERT INTO threads (id, title, agent_id, agent_name, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (id) DO UPDATE SET
       title = EXCLUDED.title,
       agent_name = EXCLUDED.agent_name,
       updated_at = EXCLUDED.updated_at`,
    [
      thread.id,
      thread.title,
      thread.agent_id,
      thread.agent_name ?? null,
      thread.created_at,
      thread.updated_at,
    ],
  );
}

export async function upsertThreads(threads: Thread[]): Promise<void> {
  for (const thread of threads) {
    await upsertThread(thread);
  }
}

export async function deleteThread(id: string): Promise<void> {
  const db = await getDb();
  await db.query("DELETE FROM threads WHERE id = $1", [id]);
}
