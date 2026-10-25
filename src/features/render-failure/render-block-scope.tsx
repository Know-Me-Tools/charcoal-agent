import { useAui, useAuiState } from "@assistant-ui/react";
import { type ReactNode, useMemo } from "react";
import { isFixTurnText } from "./fix-turn";
import { fenceBodies, fenceIndexIn, RenderBlockContext } from "./block-context";

interface MessageLike {
	id: string;
	role: string;
	content: ReadonlyArray<{ type: string; text?: string }>;
}

function textOf(message: MessageLike): string {
	return message.content.map((part) => (part.type === "text" ? (part.text ?? "") : "")).join("");
}

const FIX_TURN_SEPARATOR = "\n\u0000\n";

const BODY_SEPARATOR = "\u0001";

/**
 * Gives failed blocks inside one message the facts the repair action needs.
 * `text` is the message text the renderer is showing; the context value
 * depends only on the fenced bodies in it, so prose deltas do not change it.
 */
export function RenderBlockScope({ text, children }: { text: string; children: ReactNode }) {
	const aui = useAui();
	const messageId = useAuiState((s) => s.message.id);
	const isStreaming = useAuiState((s) => s.thread.isRunning);
	const isReplyToFixTurn = useAuiState((s) => {
		const messages = s.thread.messages as readonly MessageLike[];
		const at = messages.findIndex((m) => m.id === s.message.id);
		const previous = at > 0 ? messages[at - 1] : undefined;
		return previous?.role === "user" && isFixTurnText(textOf(previous));
	});
	const fixTurnsText = useAuiState((s) =>
		(s.thread.messages as readonly MessageLike[])
			.filter((m) => m.role === "user")
			.map(textOf)
			.filter(isFixTurnText)
			.join(FIX_TURN_SEPARATOR),
	);
	const bodiesKey = fenceBodies(text).join(BODY_SEPARATOR);

	const value = useMemo(
		() => ({
			messageId,
			isStreaming,
			isReplyToFixTurn,
			fixTurnsText,
			getBlockIndex: (source: string) => fenceIndexIn(bodiesKey.split(BODY_SEPARATOR), source),
			sendTurn: (text: string) => {
				aui.thread().append({ role: "user", content: [{ type: "text", text }] });
			},
		}),
		[aui, messageId, isStreaming, isReplyToFixTurn, fixTurnsText, bodiesKey],
	);
	return <RenderBlockContext.Provider value={value}>{children}</RenderBlockContext.Provider>;
}
