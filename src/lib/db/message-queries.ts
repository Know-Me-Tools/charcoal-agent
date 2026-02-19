import type { ContentBlock, RichMessage } from "@/types/chat-content";
import { getDb } from "./pglite";

interface MessageRow {
  id: string;
  thread_id: string;
  role: string;
  content: string;
  created_at: string;
}

function rowToRichMessage(row: MessageRow): RichMessage {
  const content: ContentBlock[] =
    typeof row.content === "string" ? JSON.parse(row.content) : row.content;
  return {
    id: row.id,
    role: row.role as RichMessage["role"],
    content,
    createdAt: new Date(row.created_at),
    status: "complete",
  };
}

export async function getMessagesByThread(
  threadId: string,
): Promise<RichMessage[]> {
  const db = await getDb();
  const result = await db.query<MessageRow>(
    "SELECT * FROM messages WHERE thread_id = $1 ORDER BY created_at ASC",
    [threadId],
  );
  return result.rows.map(rowToRichMessage);
}

export async function upsertMessage(
  threadId: string,
  message: RichMessage,
): Promise<void> {
  const db = await getDb();
  await db.query(
    `INSERT INTO messages (id, thread_id, role, content, created_at)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (id) DO UPDATE SET
       role = EXCLUDED.role,
       content = EXCLUDED.content`,
    [
      message.id,
      threadId,
      message.role,
      JSON.stringify(message.content),
      message.createdAt.toISOString(),
    ],
  );
}

export async function upsertMessages(
  threadId: string,
  messages: RichMessage[],
): Promise<void> {
  for (const msg of messages) {
    await upsertMessage(threadId, msg);
  }
}

export async function deleteThreadMessages(threadId: string): Promise<void> {
  const db = await getDb();
  await db.query("DELETE FROM messages WHERE thread_id = $1", [threadId]);
}
