import { useMemo } from "react";
import { useChatMessageStore } from "@/stores/chat-message-store";
import type { CitationContentBlock, RichMessage } from "@/types/chat-content";

export interface ThreadCitation {
  source: string;
  url?: string;
}

const NO_MESSAGES: RichMessage[] = [];

/** Citations cited in the thread so far, in first-cited order, each source once. */
export function useThreadCitations(threadId: string | undefined): ThreadCitation[] {
  const messages = useChatMessageStore((s) => (threadId ? s.messagesByThread[threadId] : undefined)) ?? NO_MESSAGES;

  return useMemo(() => {
    const seen = new Set<string>();
    const citations: ThreadCitation[] = [];
    for (const message of messages) {
      for (const block of message.content) {
        if (block.type !== "citation") continue;
        const { source, url } = block as CitationContentBlock;
        const key = `${source}\u0000${url ?? ""}`;
        if (seen.has(key)) continue;
        seen.add(key);
        citations.push({ source, url });
      }
    }
    return citations;
  }, [messages]);
}
