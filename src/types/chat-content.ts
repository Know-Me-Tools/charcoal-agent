// Rich content block types for assistant-ui compatibility
// These map to ThreadMessageLike content parts

export interface TextContentBlock {
  type: "text";
  text: string;
}

export interface ReasoningContentBlock {
  type: "reasoning";
  text: string;
}

export interface ToolCallContentBlock {
  type: "tool-call";
  toolCallId: string;
  toolName: string;
  args: Record<string, unknown>;
  result?: string;
  status: "running" | "complete" | "failed";
}

export interface CitationContentBlock {
  type: "citation";
  source: string;
  content: string;
  url?: string;
}

export interface SkillActivationContentBlock {
  type: "skill-activation";
  skillName: string;
  status: "active" | "complete";
}

export interface ImageContentBlock {
  type: "image";
  url: string;
  alt?: string;
}

export interface ErrorContentBlock {
  type: "error";
  message: string;
  code?: string;
}

export type ContentBlock =
  | TextContentBlock
  | ReasoningContentBlock
  | ToolCallContentBlock
  | CitationContentBlock
  | SkillActivationContentBlock
  | ImageContentBlock
  | ErrorContentBlock;

export interface RichMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: ContentBlock[];
  createdAt: Date;
  status?: "in_progress" | "complete" | "failed";
}

export interface StreamingState {
  isStreaming: boolean;
  runId: string | null;
  // The in-progress assistant message being built
  streamingMessageId: string | null;
}

// Utility: check if a message has any text content
export function getMessageText(message: RichMessage): string {
  return message.content
    .filter((b): b is TextContentBlock => b.type === "text")
    .map((b) => b.text)
    .join("");
}

// Convert a plain string message to a RichMessage
export function textToRichMessage(
  id: string,
  role: RichMessage["role"],
  text: string,
  createdAt?: Date,
): RichMessage {
  return {
    id,
    role,
    content: [{ type: "text", text }],
    createdAt: createdAt ?? new Date(),
    status: "complete",
  };
}
