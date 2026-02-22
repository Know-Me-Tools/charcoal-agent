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
  skillId: string;
  skillName: string;
  selectionMethod?: string;
  status: "active" | "complete";
}

export interface ContextUpdateContentBlock {
  type: "context-update";
  strategy: string;
  messagesRemoved: number;
  tokensSaved: number;
  wasApplied: boolean;
  summaryGenerated: boolean;
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

export interface MemoryItem {
  key: string;
  value: string;
  source: string;
  scope?: string;
  memoryType?: string;
  importance?: number;
}

export interface MemoryRecallContentBlock {
  type: "memory-recall";
  /** Memory items that were injected into context before the model call. */
  items: MemoryItem[];
  count: number;
}

export interface MemoryMutationContentBlock {
  type: "memory-mutation";
  /** "created" | "updated" | "deleted" */
  operation: string;
  memoryId: string;
  content: string;
  scope: string;
  memoryType: string;
}

export interface ArtifactContentBlock {
  type: "artifact";
  artifactId: string;
  artifactType: string;
  title: string;
  /** Full artifact content (code, markdown, SVG, etc.) */
  content: string;
  /** Optional language hint for syntax highlighting (e.g. "tsx", "svg"). */
  language?: string;
  /** True when the UAR is requesting user input to continue refinement. */
  isInputRequest: boolean;
  /** The UAR run ID — required to POST an artifact response back to the server. */
  runId?: string;
  /** A2UI metadata (options list, JSON schema, prompt text, etc.) */
  metadata?: Record<string, unknown>;
}

export type ContentBlock =
  | TextContentBlock
  | ReasoningContentBlock
  | ToolCallContentBlock
  | CitationContentBlock
  | SkillActivationContentBlock
  | ContextUpdateContentBlock
  | ImageContentBlock
  | ErrorContentBlock
  | MemoryRecallContentBlock
  | MemoryMutationContentBlock
  | ArtifactContentBlock;

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
  // True from request submission until first token arrives
  awaitingFirstToken: boolean;
  // Retry state for connection failures
  retryAttempt: number;
  retryMaxAttempts: number;
  retryDelayMs: number;
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
