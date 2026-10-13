/**
 * Reserved tool names for blocks stored as tool-call blocks (the existing
 * store actions have no other slot for them) and rendered by their own
 * renderer in `tool-call-part.tsx`, like the `__skill__`/`__context__`
 * encodings in `use-chat-runtime.ts`.
 */
export const CANCELLED_PART = "__cancelled__";
export const SUBAGENT_PART = "__subagent__";
export const APPROVAL_PART = "__approval__";
export const STEP_PART = "__step__";

/**
 * Not stored: `richMessageToThreadMessageLike` folds each run of consecutive
 * citation blocks into one part with this name, rendered as one Sources list.
 */
export const CITATIONS_PART = "__citations__";

/** Same shape as UAR's `agui.done` usage (UAR PR #361). */
export interface CancelledUsage {
  input_tokens?: number;
  output_tokens?: number;
  total_tokens?: number;
}

export type SubagentStatus = "running" | "complete" | "failed" | "cancelled";
