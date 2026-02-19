import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type { Thread, ThreadDetail, CreateThreadPayload } from "@/types";
import { useThreadStore } from "@/stores/thread-store";

const THREADS_KEY = ["threads"] as const;
const threadDetailKey = (id: string) => ["threads", id] as const;

export function useThreads() {
  return useQuery({
    queryKey: THREADS_KEY,
    queryFn: () => api.get<Thread[]>("/api/sessions"),
  });
}

export function useThreadDetail(id: string | null) {
  return useQuery({
    queryKey: threadDetailKey(id ?? ""),
    queryFn: () => api.get<ThreadDetail>(`/api/sessions/${id}`),
    enabled: !!id,
  });
}

export function useCreateThread() {
  const qc = useQueryClient();
  const setActiveThread = useThreadStore((s) => s.setActiveThread);

  return useMutation({
    mutationFn: (payload: CreateThreadPayload) =>
      api.post<Thread>("/api/sessions", payload),
    onSuccess: (thread) => {
      qc.invalidateQueries({ queryKey: THREADS_KEY });
      setActiveThread(thread.id);
    },
  });
}

export function useDeleteThread() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/api/sessions/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: THREADS_KEY });
    },
  });
}

export function useActiveThread() {
  const activeThreadId = useThreadStore((s) => s.activeThreadId);
  const setActiveThread = useThreadStore((s) => s.setActiveThread);
  return { activeThreadId, setActiveThread };
}

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
