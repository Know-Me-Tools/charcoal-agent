import type { ContentBlock, RichMessage } from "@/types/chat-content";
import type { ExportInput } from "./okf-serialize";

export const EXPORTED_AT = new Date("2026-10-14T05:12:03Z");

export function msg(
	id: string,
	role: RichMessage["role"],
	content: ContentBlock[],
	at: string,
	status: RichMessage["status"] = "complete",
): RichMessage {
	return { id, role, content, createdAt: new Date(at), status };
}

export function convo(messages: RichMessage[], title = "Rust release question"): ExportInput {
	return {
		thread: { title, id: "11111111-aaaa-4bbb-8ccc-222222222222", sessionId: "11111111-aaaa-4bbb-8ccc-222222222222" },
		messages,
		exportedAt: EXPORTED_AT,
		producer: "knowme-site",
	};
}

export const T0 = "2026-10-14T04:55:00Z";
export const T1 = "2026-10-14T04:55:09Z";

export function ask(text = "What is the latest stable Rust release?"): RichMessage {
	return msg("user-msg-00000001", "user", [{ type: "text", text }], T0);
}

export function reply(content: ContentBlock[], status: RichMessage["status"] = "complete"): RichMessage {
	return msg("asst-msg-00000001", "assistant", content, T1, status);
}
