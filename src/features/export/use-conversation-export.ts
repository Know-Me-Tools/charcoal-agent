/**
 * Export state for the open conversation (task 4.3/4.4). The file is built when
 * the menu opens, from the in-memory thread the visitor is looking at, so the
 * tap that saves it is synchronous. Nothing is read from or written to the
 * network or to storage.
 */
import { useMemo } from "react";
import { selectIsStreaming, useChatMessageStore } from "@/stores/chat-message-store";
import { useThreadRegistryStore } from "@/stores/thread-registry-store";
import { isSiteBuild } from "@/hooks/use-site-config";
import { serializeConversation } from "./okf-serialize";
import { buildMarkdownFile, detectCapabilities, type SaveCapabilities } from "./save-flow";

export type ConversationExportState =
	| { kind: "ready"; file: File; markdown: string; caps: SaveCapabilities }
	| { kind: "streaming" }
	| { kind: "empty" };

/**
 * `open` is true while the menu or sheet is showing. The file is built only
 * then, once per opening (and again if streaming starts or stops meanwhile).
 */
export function useConversationExport(threadId: string, open: boolean): ConversationExportState {
	const isStreaming = useChatMessageStore(selectIsStreaming(threadId));

	return useMemo<ConversationExportState>(() => {
		if (isStreaming) return { kind: "streaming" };
		if (!open) return { kind: "empty" };
		// Read at open time, not subscribed: the snapshot is what the visitor sees now.
		const messages = useChatMessageStore.getState().messagesByThread[threadId] ?? [];
		const thread = useThreadRegistryStore.getState().threads[threadId];
		const result = serializeConversation({
			thread: {
				title: thread?.title ?? "",
				id: threadId,
				sessionId: thread?.sessionId,
				agentId: thread?.agentId ?? null,
			},
			messages,
			exportedAt: new Date(),
			producer: isSiteBuild() ? "knowme-site" : "knowme-app",
		});
		if (result === null) return { kind: "empty" };
		const file = buildMarkdownFile(result.filename, result.markdown);
		return { kind: "ready", file, markdown: result.markdown, caps: detectCapabilities(file) };
	}, [isStreaming, open, threadId]);
}
