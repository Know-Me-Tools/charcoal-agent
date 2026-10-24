import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useChatIntentStore } from "@/stores/chat-intent-store";
import { useThreadRegistryStore } from "@/stores/thread-registry-store";

/**
 * Starts a new conversation: registers an ephemeral thread, queues the first
 * prompt and opens `/threads/<uuid>`. The landing composer, the ask chips, the
 * inline composer and the header entry all start a chat through this one hook.
 *
 * `startChat(prompt)` opens a thread whose first user message is `prompt`
 * (trimmed). `startChat()` or a blank prompt opens an empty thread. The prompt
 * is written to the intent store BEFORE navigating so the thread page reads it
 * synchronously on first render. Returns the new thread id.
 */
export function useStartChat(): (prompt?: string) => string {
	const navigate = useNavigate();
	const setPendingPrompt = useChatIntentStore((s) => s.setPendingPrompt);
	const registerThread = useThreadRegistryStore((s) => s.registerThread);

	return useCallback(
		(prompt?: string) => {
			// Ephemeral until the first reply arrives, then promoted to persisted.
			const sessionId = crypto.randomUUID();
			registerThread(sessionId);
			const trimmed = prompt?.trim();
			if (trimmed) setPendingPrompt(trimmed);
			navigate(`/threads/${sessionId}`);
			return sessionId;
		},
		[navigate, registerThread, setPendingPrompt],
	);
}
