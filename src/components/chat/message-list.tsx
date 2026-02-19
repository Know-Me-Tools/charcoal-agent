import { useRef, useEffect } from "react";
import { MessageBubble } from "@/components/chat/message-bubble";
import { ToolCallCard } from "@/components/chat/tool-call-card";
import { StreamingCursor } from "@/components/chat/streaming-cursor";
import { useStreamingMessage } from "@/hooks/use-threads";
import type { Message } from "@/types";

interface MessageListProps {
  messages: Message[];
}

export function MessageList({ messages }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const { streamingMessage } = useStreamingMessage();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingMessage.content]);

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
