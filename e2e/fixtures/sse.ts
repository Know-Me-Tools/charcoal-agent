/**
 * Scripted AG-UI SSE stream for the chat fixture. Event names and payload
 * shapes mirror `src/features/chat/use-message-stream.ts` (which mirrors UAR
 * `src/uar/api/sse.rs`). One event of every rendered block type, in a
 * realistic order.
 */

export const FIXTURE_REQUEST_ID = "req-fixture-001";
export const FIXTURE_FINAL_TEXT = "That covers everything for this week.";
/**
 * A single unbroken identifier with no spaces, long enough to overflow a
 * 320px viewport unless the tool-name span wraps anywhere instead of
 * truncating (chat-surfaces-flat2, §7.7 tool call block).
 */
export const LONG_TOOL_NAME =
  "calendar_list_events_for_the_current_and_upcoming_fiscal_quarter_across_every_connected_calendar_and_timezone";

/** Tool names for the running (never resolves) and failed tool-call states. */
export const RUNNING_TOOL_NAME = "send_calendar_invite";
export const FAILED_TOOL_NAME = "sync_contacts";
export const FAILED_TOOL_RESULT = "Contacts provider unavailable";

/** Title of the HTML artifact fence in `ASSISTANT_MARKDOWN` (chat-surfaces spec scenario 11). */
export const HTML_ARTIFACT_LABEL = "html artifact";

/**
 * Alt text of the markdown image in `ASSISTANT_MARKDOWN` (chat-surfaces spec
 * scenarios 2, 13, 19 — "every block type" includes image and divider). A
 * 1x1 transparent PNG data URI avoids a real network fetch in headless runs;
 * `enhanced-markdown-text.tsx`'s `img` component map entry renders it the
 * same way it would render any markdown image.
 */
export const FIXTURE_IMAGE_ALT = "Rebrand palette swatch";
const FIXTURE_IMAGE_DATA_URI =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";

export type SseEvent = { event: string; data: Record<string, unknown> };

const rid = FIXTURE_REQUEST_ID;

const ASSISTANT_MARKDOWN = [
  "Here is your plan for the week, based on what I remember about your priorities.\n\n",
  "## Focus areas\n\n",
  "1. **Ship the rebrand** — tokens first, then surfaces.\n",
  "2. **Review the roadmap** with the team on Thursday.\n\n",
  "A quick helper you asked for:\n\n",
  "```ts\nexport function weekOf(date: Date): number {\n  const start = new Date(date.getFullYear(), 0, 1);\n  return Math.ceil(((+date - +start) / 86400000 + start.getDay() + 1) / 7);\n}\n```\n\n",
  "Inline math also renders: $e^{i\\pi} + 1 = 0$.\n\n",
  "```mermaid\ngraph LR\n  Plan --> Build --> Review\n```\n\n",
  "A long identifier that must wrap: https://know-me.tools/very/long/path/that/keeps/going/without/any/spaces/at/all/to/check/wrapping/behaviour/in/narrow/viewports\n\n",
  "```html\n<!doctype html>\n<html>\n  <head>\n    <title>Rebrand quick look</title>\n  </head>\n  <body>\n    <h1>Rebrand quick look</h1>\n    <p>A tiny preview page for the new brand tokens.</p>\n  </body>\n</html>\n```\n\n",
  `![${FIXTURE_IMAGE_ALT}](${FIXTURE_IMAGE_DATA_URI})\n\n`,
  "---\n\n",
  FIXTURE_FINAL_TEXT,
];

const A2UI_ENVELOPE = {
  surfaceUpdate: {
    surfaceId: "weekly-summary",
    components: [
      { id: "root", component: { Column: { children: { explicitList: ["title", "body"] } } } },
      { id: "title", component: { Text: { text: { literalString: "Weekly summary" }, usageHint: "h3" } } },
      { id: "body", component: { Text: { text: { literalString: "3 meetings · 2 deadlines · 1 trip" } } } },
    ],
  },
};

/**
 * Realistic order: skill activation, context update and memory recall arrive
 * before the first thinking/text token (the store must keep them).
 */
export const FIXTURE_EVENTS: SseEvent[] = [
  { event: "agui.stream.start", data: { kind: "stream", phase: "start", request_id: rid } },
  {
    event: "agui.skill.activated",
    data: {
      kind: "skill",
      phase: "activated",
      request_id: rid,
      skill: { id: "knowme-profile", title: "KnowMe Profile" },
      selection_method: "semantic",
    },
  },
  {
    event: "agui.context.update",
    data: {
      kind: "context",
      phase: "update",
      strategy: "summarize_oldest",
      messages_removed: 6,
      tokens_saved: 4210,
      was_applied: true,
      summary_generated: true,
    },
  },
  {
    event: "agui.memory.recall",
    data: {
      kind: "memory",
      phase: "recall",
      request_id: rid,
      count: 2,
      items: [
        { key: "work.focus", value: "Rebrand launch this month", source: "conversation", scope: "user", memory_type: "semantic", importance: 0.9 },
        { key: "schedule.thursday", value: "Roadmap review 14:00", source: "calendar", scope: "user", memory_type: "episodic", importance: 0.7 },
      ],
    },
  },
  { event: "agui.thinking.delta", data: { kind: "thinking", phase: "delta", request_id: rid, delta: { text: "The user wants a weekly plan. " } } },
  { event: "agui.reasoning.delta", data: { kind: "reasoning", phase: "delta", request_id: rid, delta: { text: "Check the calendar, then summarise priorities." } } },
  { event: "agui.tool_call.delta", data: { kind: "tool_call", phase: "delta", request_id: rid, call_index: 0, id: "call-1", delta: { arguments: '{"range":' } } },
  { event: "agui.tool_call.delta", data: { kind: "tool_call", phase: "delta", request_id: rid, call_index: 0, id: "call-1", delta: { arguments: '"this_week"}' } } },
  {
    event: "agui.tool_call.complete",
    data: { kind: "tool_call", phase: "complete", request_id: rid, call_index: 0, id: "call-1", name: "calendar_list_events", arguments_json: '{"range":"this_week"}' },
  },
  {
    event: "agui.tool_result",
    data: { kind: "tool_result", request_id: rid, call_index: 0, id: "call-1", name: "calendar_list_events", content: '[{"title":"Roadmap review","day":"Thu"}]', success: true },
  },
  { event: "agui.tool_call.delta", data: { kind: "tool_call", phase: "delta", request_id: rid, call_index: 1, id: "call-2", delta: { arguments: "{}" } } },
  {
    event: "agui.tool_call.complete",
    data: { kind: "tool_call", phase: "complete", request_id: rid, call_index: 1, id: "call-2", name: LONG_TOOL_NAME, arguments_json: "{}" },
  },
  {
    event: "agui.tool_result",
    data: { kind: "tool_result", request_id: rid, call_index: 1, id: "call-2", name: LONG_TOOL_NAME, content: '{"ok":true}', success: true },
  },
  // Running: completes the call but never gets a tool_result, so the block's
  // own `status` stays "running" (use-message-stream.ts only flips it to
  // "complete"/"failed" on agui.tool_result) — chat-surfaces spec scenario 9.
  { event: "agui.tool_call.delta", data: { kind: "tool_call", phase: "delta", request_id: rid, call_index: 2, id: "call-3", delta: { arguments: '{"attendee":' } } },
  {
    event: "agui.tool_call.complete",
    data: { kind: "tool_call", phase: "complete", request_id: rid, call_index: 2, id: "call-3", name: RUNNING_TOOL_NAME, arguments_json: '{"attendee":"team@know-me.tools"}' },
  },
  // Failed: a tool_result with success:false flips the block's status to
  // "failed" (`ToolCallBlockWrapper` maps that to the "Failed" pill).
  { event: "agui.tool_call.delta", data: { kind: "tool_call", phase: "delta", request_id: rid, call_index: 3, id: "call-4", delta: { arguments: "{}" } } },
  {
    event: "agui.tool_call.complete",
    data: { kind: "tool_call", phase: "complete", request_id: rid, call_index: 3, id: "call-4", name: FAILED_TOOL_NAME, arguments_json: "{}" },
  },
  {
    event: "agui.tool_result",
    data: { kind: "tool_result", request_id: rid, call_index: 3, id: "call-4", name: FAILED_TOOL_NAME, content: FAILED_TOOL_RESULT, success: false },
  },
  {
    event: "agui.citation.added",
    data: {
      kind: "citation",
      phase: "added",
      request_id: rid,
      citation: { index: 1, url: "https://know-me.tools/docs/planning", title: "Planning guide", snippet: "Group work into two or three focus areas per week." },
    },
  },
  ...ASSISTANT_MARKDOWN.map((text) => ({
    event: "agui.message.delta",
    data: { kind: "message", phase: "delta", request_id: rid, delta: { text } },
  })),
  {
    event: "agui.memory.mutation",
    data: {
      kind: "memory",
      phase: "mutation",
      request_id: rid,
      operation: "add",
      memory_id: "mem-42",
      content: "Prefers weekly plans on Monday mornings",
      scope: "user",
      memory_type: "preference",
    },
  },
  {
    event: "agui.artifact",
    data: {
      kind: "artifact",
      phase: "complete",
      request_id: rid,
      artifact_id: "art-mermaid",
      artifact_type: "diagram",
      title: "Week flow",
      content: "graph LR\n  Plan --> Build --> Review",
      language: "mermaid",
    },
  },
  {
    event: "agui.artifact",
    data: {
      kind: "artifact",
      phase: "complete",
      request_id: rid,
      artifact_id: "art-code",
      artifact_type: "code",
      title: "checklist.md",
      content: "- [x] Tokens\n- [ ] Surfaces\n- [ ] Audit",
      language: "markdown",
    },
  },
  {
    event: "agui.artifact_input_request",
    data: {
      kind: "artifact_input_request",
      request_id: rid,
      artifact_id: "art-confirm",
      artifact_type: "confirm",
      title: "Add Thursday review to calendar?",
      content: JSON.stringify({ message: "Add the roadmap review to your calendar?", accept_label: "Add", cancel_label: "Skip" }),
    },
  },
  { event: "agui.custom", data: { kind: "custom", name: "a2ui", value: A2UI_ENVELOPE } },
  { event: "agui.done", data: { kind: "done", request_id: rid } },
];

/**
 * A prefix of the fixture stream with no `agui.done`, paired with
 * `holdChatStreamOpen` (`e2e/support/uar-mock.ts`), which serves the body
 * over a response that never closes so the client never sees the reader
 * finish and the message stays "running" — chat-surfaces spec scenario 12
 * (streaming indicator) and scenario 9 (the "running" tool state). `agui.done`
 * is what `use-message-stream.ts` (and, as a fallback, the reader closing)
 * uses to finish a stream, so a body fulfilled normally — even one missing
 * `agui.done` — finishes as soon as delivery completes; only a genuinely
 * still-open response stays "running".
 *
 * Order matters here beyond realism: `@assistant-ui/core`'s
 * `toMessagePartStatus` (`normalizePartStatus.js`) only lets the LAST part in
 * a message's content array inherit the message's own "running" status —
 * every earlier part reads as "complete" once a later part exists, tool-calls
 * excepted (their status is `result === undefined ? message.status : complete`
 * regardless of position). The reply text is last here on purpose, so its
 * streaming mark is the part under test — the thinking part earlier in the
 * same array is expected to read "complete"/"Reasoning" once the text part
 * exists (see `PARTIAL_STREAM_THINKING_ONLY_EVENTS` for testing the thinking
 * pulse instead, where thinking is the only, and therefore last, part).
 */
export const PARTIAL_STREAM_EVENTS: SseEvent[] = [
  { event: "agui.stream.start", data: { kind: "stream", phase: "start", request_id: rid } },
  { event: "agui.thinking.delta", data: { kind: "thinking", phase: "delta", request_id: rid, delta: { text: "The user wants a weekly plan. " } } },
  { event: "agui.tool_call.delta", data: { kind: "tool_call", phase: "delta", request_id: rid, call_index: 2, id: "call-3", delta: { arguments: '{"attendee":' } } },
  {
    event: "agui.tool_call.complete",
    data: { kind: "tool_call", phase: "complete", request_id: rid, call_index: 2, id: "call-3", name: RUNNING_TOOL_NAME, arguments_json: '{"attendee":"team@know-me.tools"}' },
  },
  {
    event: "agui.message.delta",
    data: { kind: "message", phase: "delta", request_id: rid, delta: { text: "Here is your plan for the week, based on what I remember about your priorities." } },
  },
];

/**
 * Thinking as the only (and therefore last) part, so it — not a later text
 * part — inherits the message's "running" status and shows the "Thinking"
 * label with the pulsing cyan dots (`ReasoningPart`, `enhanced-thread.tsx`).
 */
export const PARTIAL_STREAM_THINKING_ONLY_EVENTS: SseEvent[] = [
  { event: "agui.stream.start", data: { kind: "stream", phase: "start", request_id: rid } },
  { event: "agui.thinking.delta", data: { kind: "thinking", phase: "delta", request_id: rid, delta: { text: "The user wants a weekly plan. " } } },
];

/**
 * A distinctive raw error string that must never reach the DOM (message
 * error scenario, review round 1 fix). The completion request needs at least
 * one content event before `agui.error` — `use-message-stream.ts` only
 * creates the streaming assistant message on the first delta
 * (`getOrCreateStreamingMessage`, `src/stores/chat-message-store.ts`), and
 * `setStreamError` is a no-op with no message to attach the error to.
 */
export const RAW_STREAM_ERROR_TEXT = "internal secret trace 9f3d-x1";
export const ERROR_STREAM_EVENTS: SseEvent[] = [
  { event: "agui.stream.start", data: { kind: "stream", phase: "start", request_id: rid } },
  { event: "agui.message.delta", data: { kind: "message", phase: "delta", request_id: rid, delta: { text: "Working on your plan" } } },
  { event: "agui.error", data: { kind: "error", request_id: rid, message: RAW_STREAM_ERROR_TEXT } },
];

/** Serialise events exactly as UAR does: `event:` + `data:` lines, blank-line delimited. */
export function toSseBody(events: SseEvent[] = FIXTURE_EVENTS): string {
  return events.map((e) => `event: ${e.event}\ndata: ${JSON.stringify(e.data)}\n\n`).join("");
}

/** Non-streaming response for the thread-title request (`stream: false`). */
export const TITLE_RESPONSE = { content: "Weekly plan" };

/** Every block-producing event name the UI handles; used by the fixture test. */
export const EXPECTED_EVENT_NAMES = [
  "agui.stream.start",
  "agui.message.delta",
  "agui.thinking.delta",
  "agui.reasoning.delta",
  "agui.citation.added",
  "agui.tool_call.delta",
  "agui.tool_call.complete",
  "agui.tool_result",
  "agui.skill.activated",
  "agui.context.update",
  "agui.memory.recall",
  "agui.memory.mutation",
  "agui.artifact",
  "agui.artifact_input_request",
  "agui.custom",
  "agui.done",
] as const;
