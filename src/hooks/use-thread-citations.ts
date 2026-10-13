import { useMemo } from "react";
import { useChatMessageStore } from "@/stores/chat-message-store";
import type { CitationContentBlock, RichMessage } from "@/types/chat-content";

export interface ThreadCitation {
  /** "web" for a web-search source, "kb" for a knowledge-base source. */
  origin: "kb" | "web";
  source: string;
  url?: string;
  /** The server-computed host of a web source. */
  host?: string;
  /**
   * The stream markers this source was cited under, ascending and unique,
   * within its origin: `[n]` for "kb", `[Wn]` for "web". A source cited twice
   * under different markers keeps both (`[2] [3]`), so a marker in a reply
   * always matches the panel. Never renumbered.
   */
  indices: number[];
}

const NO_MESSAGES: RichMessage[] = [];

/** Citations cited in the thread so far, in first-cited order, each source once per origin. */
export function useThreadCitations(threadId: string | undefined): ThreadCitation[] {
  const messages = useChatMessageStore((s) => (threadId ? s.messagesByThread[threadId] : undefined)) ?? NO_MESSAGES;

  return useMemo(() => {
    const byKey = new Map<string, { origin: "kb" | "web"; source: string; url?: string; host?: string; indices: Set<number> }>();
    for (const message of messages) {
      // Same fallback as the in-message Sources list: position in the reply.
      let position = 0;
      for (const block of message.content) {
        if (block.type !== "citation") continue;
        position += 1;
        const { source, url, index, origin, host } = block as CitationContentBlock;
        const kind = origin === "web" ? "web" : "kb";
        // The origin is part of the key: a web "faq.md" is not the KB "faq.md".
        const key = `${kind}\u0000${source}\u0000${url ?? ""}`;
        const entry = byKey.get(key) ?? { origin: kind, source, url, host, indices: new Set<number>() };
        entry.indices.add(index ?? position);
        byKey.set(key, entry);
      }
    }
    return [...byKey.values()].map(({ origin, source, url, host, indices }) => ({
      origin,
      source,
      url,
      host,
      indices: [...indices].sort((a, b) => a - b),
    }));
  }, [messages]);
}
