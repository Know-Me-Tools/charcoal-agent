import { useRef, useEffect } from "react";
import { Loader2Icon } from "lucide-react";
import { MessageBubble } from "@/components/chat/message-bubble";
import { ToolCallCard } from "@/components/chat/tool-call-card";
import { StreamingCursor } from "@/components/chat/streaming-cursor";
import { useStreamingMessage } from "@/hooks/use-threads";
import { useChatMessageStore, selectIsAwaitingFirstToken } from "@/stores/chat-message-store";
import { useThreadStore } from "@/stores/thread-store";
import type { Message } from "@/types";

interface MessageListProps {
  messages: Message[];
}

export function MessageList({ messages }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const { streamingMessage } = useStreamingMessage();
  const activeThreadId = useThreadStore((s) => s.activeThreadId);
  const isAwaitingFirstToken = useChatMessageStore(
    selectIsAwaitingFirstToken(activeThreadId ?? "")
  );

  useEffect(() => {
    // Scroll to bottom when messages change, loading state toggles, or streaming content updates
    if (messages.length > 0 || isAwaitingFirstToken || streamingMessage.content) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isAwaitingFirstToken, streamingMessage.content]);

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 md:px-6">
      <div className="mx-auto max-w-3xl space-y-4">
        {messages.map((msg) => (
          <div key={msg.id}>
            <MessageBubble message={msg} />
            {msg.tool_calls?.map((tc) => (
              <ToolCallCard key={tc.id} toolCall={tc} />
            ))}
          </div>
        ))}

        {/* Loading indicator — shown while waiting for first token */}
        {isAwaitingFirstToken && !streamingMessage.content && (
          <div className="flex justify-start">
            <div className="max-w-[85%] rounded-lg border border-border bg-card px-4 py-3 text-card-foreground md:max-w-[70%]">
              <div className="flex items-center gap-2.5 py-1 text-muted-foreground/70">
                <Loader2Icon size={14} className="animate-spin text-primary" />
                <span className="font-mono text-[11px]">Agent is thinking…</span>
              </div>
            </div>
          </div>
        )}

        {streamingMessage.isStreaming && (
          <div>
            {streamingMessage.toolCalls.map((tc) => (
              <ToolCallCard key={tc.id} toolCall={tc} />
            ))}
            {streamingMessage.content && (
              <div className="flex justify-start">
                <div className="max-w-[85%] rounded-lg border border-border bg-card px-4 py-3 text-card-foreground md:max-w-[70%]">
                  <p className="body-text whitespace-pre-wrap text-[15px]">
                    {streamingMessage.content}
                    <StreamingCursor />
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  );
}
