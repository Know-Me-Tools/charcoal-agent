import { useThreadStore } from "@/stores/thread-store";

export function useStreamingMessage() {
  const streamingMessage = useThreadStore((s) => s.streamingMessage);
  const startStreaming = useThreadStore((s) => s.startStreaming);
  const appendContent = useThreadStore((s) => s.appendContent);
  const addToolCall = useThreadStore((s) => s.addToolCall);
  const updateToolCall = useThreadStore((s) => s.updateToolCall);
  const finishStreaming = useThreadStore((s) => s.finishStreaming);
  const resetStreaming = useThreadStore((s) => s.resetStreaming);

  return {
    streamingMessage,
    startStreaming,
    appendContent,
    addToolCall,
    updateToolCall,
    finishStreaming,
    resetStreaming,
  };
}
