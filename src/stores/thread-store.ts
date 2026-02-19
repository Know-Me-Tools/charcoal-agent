import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type { ToolCallEvent } from "@/types";

interface StreamingMessage {
  content: string;
  toolCalls: ToolCallEvent[];
  isStreaming: boolean;
  runId: string | null;
}

interface ThreadState {
  activeThreadId: string | null;
  streamingMessage: StreamingMessage;
  setActiveThread: (id: string | null) => void;
  startStreaming: (runId: string) => void;
  appendContent: (content: string) => void;
  addToolCall: (toolCall: ToolCallEvent) => void;
  updateToolCall: (id: string, update: Partial<ToolCallEvent>) => void;
  finishStreaming: () => void;
  resetStreaming: () => void;
}

const initialStreaming: StreamingMessage = {
  content: "",
  toolCalls: [],
  isStreaming: false,
  runId: null,
};

export const useThreadStore = create<ThreadState>()(
  immer((set) => ({
    activeThreadId: null,
    streamingMessage: { ...initialStreaming },

    setActiveThread: (id) =>
      set((state) => {
        state.activeThreadId = id;
      }),

    startStreaming: (runId) =>
      set((state) => {
        state.streamingMessage = {
          content: "",
          toolCalls: [],
          isStreaming: true,
          runId,
        };
      }),

    appendContent: (content) =>
      set((state) => {
        state.streamingMessage.content += content;
      }),

    addToolCall: (toolCall) =>
      set((state) => {
        state.streamingMessage.toolCalls.push(toolCall);
      }),

    updateToolCall: (id, update) =>
      set((state) => {
        const tc = state.streamingMessage.toolCalls.find((t) => t.id === id);
        if (tc) Object.assign(tc, update);
      }),

    finishStreaming: () =>
      set((state) => {
        state.streamingMessage.isStreaming = false;
      }),

    resetStreaming: () =>
      set((state) => {
        state.streamingMessage = { ...initialStreaming };
      }),
  })),
);
