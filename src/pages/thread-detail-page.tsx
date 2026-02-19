import { useParams } from "react-router-dom";
import { AssistantRuntimeProvider } from "@assistant-ui/react";
import { EnhancedThread } from "@/components/assistant-ui/enhanced-thread";
import { useChatRuntime } from "@/features/chat/use-chat-runtime";

export default function ThreadDetailPage() {
  const { id } = useParams<{ id: string }>();

  if (!id) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="font-mono text-sm text-muted-foreground">
          // Thread not found
        </p>
      </div>
    );
  }

  return <ThreadView threadId={id} />;
}

// Separate component so hooks run after id is validated
function ThreadView({ threadId }: { threadId: string }) {
  const runtime = useChatRuntime(threadId);

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <div className="flex flex-1 flex-col overflow-hidden">
        <EnhancedThread />
      </div>
    </AssistantRuntimeProvider>
  );
}
