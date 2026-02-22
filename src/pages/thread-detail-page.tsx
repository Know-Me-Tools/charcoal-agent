import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { AssistantRuntimeProvider } from "@assistant-ui/react";
import { EnhancedThread } from "@/components/assistant-ui/enhanced-thread";
import { ChatErrorBoundary } from "@/components/error-boundary/ChatErrorBoundary";
import { useChatRuntime } from "@/features/chat/use-chat-runtime";
import { usePromptCaching } from "@/hooks/use-prompt-caching";
import { setActiveSessionId, clearActiveSessionId } from "@/lib/api-client";
import { useThreadRegistryStore } from "@/stores/thread-registry-store";

export default function ThreadDetailPage() {
  const { id } = useParams<{ id: string }>();

  if (!id) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="font-mono text-sm text-muted-foreground">
          Thread not found
        </p>
      </div>
    );
  }

  // The resetKey ensures the boundary resets whenever the user navigates to a
  // different thread — so a crash in one thread doesn't block another.
  return (
    <ChatErrorBoundary resetKey={id}>
      <ThreadView threadId={id} />
    </ChatErrorBoundary>
  );
}

// Separate component so hooks only run after the thread ID is validated.
function ThreadView({ threadId }: { threadId: string }) {
  const { promptCachingEnabled, togglePromptCaching } = usePromptCaching();
  const runtime = useChatRuntime(threadId, { promptCachingEnabled });

  // Read the persisted sessionId from the store (loaded from PGLite on startup).
  // Falls back to threadId — they are always equal by construction, but reading
  // from the store confirms the value survived a page refresh from the DB.
  const sessionId = useThreadRegistryStore(
    (s) => s.threads[threadId]?.sessionId ?? threadId,
  );

  // Register the UAR session ID so every request made while this thread is
  // active automatically carries X-UAR-Session-ID. Cleared on unmount.
  useEffect(() => {
    setActiveSessionId(sessionId);
    return () => { clearActiveSessionId(); };
  }, [sessionId]);

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <div className="flex flex-1 flex-col overflow-hidden">
        <EnhancedThread
          promptCachingEnabled={promptCachingEnabled}
          onTogglePromptCaching={togglePromptCaching}
        />
      </div>
    </AssistantRuntimeProvider>
  );
}
