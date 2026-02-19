import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { useThreadDetail, useActiveThread, useStreamingMessage } from "@/hooks/use-threads";
import { useStartRun } from "@/hooks/use-runs";
import { MessageList } from "@/components/chat/message-list";
import { ChatInput } from "@/components/chat/chat-input";
import { EmptyState } from "@/components/common/empty-state";
import { SkeletonLine } from "@/components/common/skeleton-loader";

export default function ThreadDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { setActiveThread } = useActiveThread();
  const { data: thread, isLoading } = useThreadDetail(id ?? null);
  const startRun = useStartRun();
  const { streamingMessage } = useStreamingMessage();

  useEffect(() => {
    if (id) setActiveThread(id);
  }, [id, setActiveThread]);

  const handleSend = (message: string) => {
    if (!thread) return;
    startRun.mutate({
      session_id: thread.id,
      agent_id: thread.agent_id,
      message,
    });
  };

  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col p-4 md:p-6">
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <SkeletonLine width={i % 2 === 0 ? "w-1/2" : "w-2/3"} />
              <SkeletonLine width="w-1/4" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!thread) {
    return (
      <EmptyState
        title="Thread not found"
        description="This thread may have been deleted."
      />
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex items-center gap-3 border-b border-border px-4 py-3 md:px-6">
        <h3 className="truncate font-display text-sm font-semibold text-foreground">
          {thread.title}
        </h3>
        <span className="hidden font-mono text-[10px] text-muted-foreground sm:inline">
          {thread.id.slice(0, 8)}
        </span>
      </div>

      <MessageList messages={thread.messages ?? []} />

      <ChatInput
        onSend={handleSend}
        disabled={streamingMessage.isStreaming}
      />
    </div>
  );
}
