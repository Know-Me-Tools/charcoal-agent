import { useMemo } from "react";
import { useChatMessageStore } from "@/stores/chat-message-store";
import type { CitationContentBlock, RichMessage } from "@/types/chat-content";

export interface ThreadCitation {
  source: string;
  url?: string;
  /**
   * The stream markers this source was cited under, ascending and unique. A
   * source cited twice under different markers keeps both (`[2] [3]`), so a
   * `[n]` in a reply always matches the panel. Never renumbered.
   */
  indices: number[];
}

const NO_MESSAGES: RichMessage[] = [];

/** Citations cited in the thread so far, in first-cited order, each source once. */
export function useThreadCitations(threadId: string | undefined): ThreadCitation[] {
  const messages = useChatMessageStore((s) => (threadId ? s.messagesByThread[threadId] : undefined)) ?? NO_MESSAGES;

  return useMemo(() => {
    const byKey = new Map<string, { source: string; url?: string; indices: Set<number> }>();
    for (const message of messages) {
      // Same fallback as the in-message Sources list: position in the reply.
      let position = 0;
      for (const block of message.content) {
        if (block.type !== "citation") continue;
        position += 1;
        const { source, url, index } = block as CitationContentBlock;
        const key = `${source}\u0000${url ?? ""}`;
        const entry = byKey.get(key) ?? { source, url, indices: new Set<number>() };
        entry.indices.add(index ?? position);
        byKey.set(key, entry);
      }
    }
    return [...byKey.values()].map(({ source, url, indices }) => ({
      source,
      url,
      indices: [...indices].sort((a, b) => a - b),
    }));
  }, [messages]);
}
