/**
 * Thread Naming
 *
 * Generates a short, descriptive title for a thread after the first
 * user–assistant exchange by calling the UAR chat endpoint in non-streaming
 * mode.  A throwaway session ID is used so the title-generation call does
 * not pollute the real thread's conversation history on the backend.
 */

import { buildUrl, buildHeaders } from "@/lib/api-client";

const TITLE_GEN_PATH = "/api/chat/completion";

const TITLE_PROMPT = (userMsg: string, assistantMsg: string) =>
  `Generate a concise 4-6 word title that captures the topic of this conversation.
Reply with ONLY the title text — no quotes, punctuation, or explanation.

User: ${userMsg.slice(0, 500)}
Assistant: ${assistantMsg.slice(0, 500)}`;

interface NonStreamingResponse {
  content?: string;
  message?: string;
  choices?: { message?: { content?: string } }[];
}

/**
 * Call the UAR completion endpoint in non-streaming mode to get a short title.
 *
 * Falls back to streaming collection if the server does not return a
 * `content` field in JSON (some UAR versions may only stream).
 */
export async function generateThreadTitle(
  userMsg: string,
  assistantMsg: string,
): Promise<string> {
  const fallback = "New conversation";
  if (!userMsg.trim() || !assistantMsg.trim()) return fallback;

  // Use an ephemeral session so this call never leaks into real thread history.
  // Must be a valid UUID — the UAR validates X-UAR-Session-ID strictly.
  const ephemeralSessionId = crypto.randomUUID();

  try {
    const res = await fetch(buildUrl(TITLE_GEN_PATH), {
      method: "POST",
      headers: buildHeaders({ "X-UAR-Session-ID": ephemeralSessionId }),
      body: JSON.stringify({
        message: TITLE_PROMPT(userMsg, assistantMsg),
        stream: false,
      }),
    });

    if (!res.ok) return fallback;

    const contentType = res.headers.get("content-type") ?? "";

    // ── Non-streaming JSON response ────────────────────────────────────────
    if (contentType.includes("application/json")) {
      const json = (await res.json()) as NonStreamingResponse;

      const title =
        json.content ??
        json.message ??
        json.choices?.[0]?.message?.content ??
        null;

      if (title?.trim()) return cleanTitle(title);
      return fallback;
    }

    // ── Streaming fallback: collect all text deltas ───────────────────────
    if (!res.body) return fallback;

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let collected = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const blocks = buffer.split("\n\n");
      buffer = blocks.pop() ?? "";

      for (const raw of blocks) {
        if (!raw.trim()) continue;

        let data = "";
        let event = "message";
        for (const line of raw.split("\n")) {
          if (line.startsWith("event:")) event = line.slice(6).trim();
          else if (line.startsWith("data:")) data = line.slice(5).trim();
        }

        if (data === "[DONE]") break;

        if (event === "agui.message.delta" && data) {
          try {
            const parsed = JSON.parse(data) as { delta?: { text?: string } };
            if (parsed.delta?.text) collected += parsed.delta.text;
          } catch {
            // ignore parse errors
          }
        } else if (event === "message" && data && data !== "[DONE]") {
          try {
            const parsed = JSON.parse(data) as {
              choices?: { delta?: { content?: string } }[];
            };
            const chunk = parsed.choices?.[0]?.delta?.content;
            if (chunk) collected += chunk;
          } catch {
            // ignore parse errors
          }
        }
      }
    }

    if (collected.trim()) return cleanTitle(collected);
    return fallback;
  } catch {
    return fallback;
  }
}

/** Strip surrounding quotes, trim whitespace, truncate to 80 chars. */
function cleanTitle(raw: string): string {
  return raw
    .trim()
    .replace(/^["']|["']$/g, "")
    .trim()
    .slice(0, 80);
}
