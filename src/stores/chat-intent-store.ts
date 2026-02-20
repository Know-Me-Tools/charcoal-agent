/**
 * Chat Intent Store
 *
 * Acts as a cross-page intent queue: the landing page (or any other page)
 * writes a pending prompt here before navigating to the thread view.  The
 * thread view reads and *consumes* it on mount — atomically clears the value
 * so a page refresh or back-navigation doesn't re-fire the same message.
 *
 * Why a store instead of router location.state?
 *   - location.state is lost on refresh and isn't observable outside the
 *     component that received the navigation.
 *   - A Zustand store persists for the lifetime of the tab, is subscribable
 *     from any component, and makes the intent testable in isolation.
 */
import { create } from "zustand";

interface ChatIntentState {
  /** Prompt waiting to be sent when a thread mounts. Null = nothing pending. */
  pendingPrompt: string | null;
}

interface ChatIntentActions {
  /** Write a prompt to the queue (called by the landing page). */
  setPendingPrompt: (prompt: string) => void;
  /**
   * Read and clear the pending prompt atomically.
   * Returns the prompt string, or null if the queue was empty.
   */
  consumePendingPrompt: () => string | null;
}

export type ChatIntentStore = ChatIntentState & ChatIntentActions;

export const useChatIntentStore = create<ChatIntentStore>((set, get) => ({
  pendingPrompt: null,

  setPendingPrompt: (prompt) => set({ pendingPrompt: prompt }),

  consumePendingPrompt: () => {
    const prompt = get().pendingPrompt;
    if (prompt !== null) set({ pendingPrompt: null });
    return prompt;
  },
}));
