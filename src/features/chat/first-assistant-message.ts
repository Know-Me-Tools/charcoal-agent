/**
 * Whether `index` is the position of the first assistant message in
 * `messages` — identity, not content, so it's knowable before that
 * message's first part (and therefore its first streamed token) exists.
 * Used by `AssistantMessage` (enhanced-thread.tsx) to decide when to show
 * the AI disclosure label (site-ai-disclosure-label, FR-31). Kept out of
 * that component file so it stays importable as a plain function without
 * triggering react-refresh's "only export components" check.
 */
export function isFirstAssistantMessageIndex(
  messages: readonly { role: string }[],
  index: number,
): boolean {
  return messages.findIndex((m) => m.role === "assistant") === index;
}
