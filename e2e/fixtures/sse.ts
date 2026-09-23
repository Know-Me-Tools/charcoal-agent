/**
 * Scripted AG-UI SSE stream for the chat fixture. Event names and payload
 * shapes mirror `src/features/chat/use-message-stream.ts` (which mirrors UAR
 * `src/uar/api/sse.rs`). One event of every rendered block type, in a
 * realistic order.
 */

export const FIXTURE_REQUEST_ID = "req-fixture-001";
export const FIXTURE_FINAL_TEXT = "That covers everything for this week.";

type SseEvent = { event: string; data: Record<string, unknown> };

const rid = FIXTURE_REQUEST_ID;

const ASSISTANT_MARKDOWN = [
  "Here is your plan for the week, based on what I remember about your priorities.\n\n",
  "## Focus areas\n\n",
  "1. **Ship the rebrand** — tokens first, then surfaces.\n",
  "2. **Review the roadmap** with the team on Thursday.\n\n",
  "A quick helper you asked for:\n\n",
  "```ts\nexport function weekOf(date: Date): number {\n  const start = new Date(date.getFullYear(), 0, 1);\n  return Math.ceil(((+date - +start) / 86400000 + start.getDay() + 1) / 7);\n}\n```\n\n",
  "Inline math also renders: $e^{i\\pi} + 1 = 0$.\n\n",
  "A long identifier that must wrap: https://know-me.tools/very/long/path/that/keeps/going/without/any/spaces/at/all/to/check/wrapping/behaviour/in/narrow/viewports\n\n",
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

export const FIXTURE_EVENTS: SseEvent[] = [
  { event: "agui.stream.start", data: { kind: "stream", phase: "start", request_id: rid } },
  // The client creates the assistant message on the first text/thinking delta and
  // currently drops block events that arrive earlier (see visual-verification-harness
  // verification.md). Keep a thinking delta first so every block is rendered.
  { event: "agui.thinking.delta", data: { kind: "thinking", phase: "delta", request_id: rid, delta: { text: "The user wants a weekly plan. " } } },
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
