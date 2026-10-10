import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { mockFetch } from "@/test/utils/mock-fetch";
import type { ContentBlock } from "@/types/chat-content";

// PGlite is not available in jsdom; see use-message-stream.test.ts.
vi.mock("@/lib/db/pglite", () => ({
  getDbInstance: () => {
    throw new Error("no db in tests");
  },
  whenDbReady: () => new Promise<never>(() => {}),
}));

const { useChatMessageStore } = await import("@/stores/chat-message-store");
const { useMessageStream } = await import("./use-message-stream");

const RID = "req-dispatch";

interface SseEvent {
  event: string;
  data: Record<string, unknown>;
}

function sse(events: SseEvent[]): string {
  return events.map((e) => `event: ${e.event}\ndata: ${JSON.stringify(e.data)}\n\n`).join("");
}

const START: SseEvent = {
  event: "agui.stream.start",
  data: { kind: "stream", phase: "start", request_id: RID },
};
const DONE: SseEvent = { event: "agui.done", data: { kind: "done", request_id: RID } };
const TEXT: SseEvent = {
  event: "agui.message.delta",
  data: { kind: "message", phase: "delta", request_id: RID, delta: { text: "Hello" } },
};

/** Replays `events` through the real hook and returns the assistant message. */
async function replay(threadId: string, events: SseEvent[]) {
  const fetchMock = mockFetch({
    "POST /api/chat/completion": () => ({ status: 200, raw: sse(events) }),
  });
  useChatMessageStore.getState().clearThread(threadId);
  useChatMessageStore.getState().initThread(threadId, []);

  const { result } = renderHook(() => useMessageStream());
  await act(async () => {
    await result.current.startStream(threadId, { message: "hi" });
  });
  fetchMock.restore();

  const messages = useChatMessageStore.getState().messagesByThread[threadId] ?? [];
  return messages.find((m) => m.role === "assistant");
}

function blocksOf(content: ContentBlock[] | undefined, type: ContentBlock["type"]) {
  return (content ?? []).filter((b) => b.type === type);
}

afterEach(() => {
  vi.restoreAllMocks();
});

/**
 * agui-render-registry task 1.1: characterization of how use-message-stream
 * maps each AG-UI event it handles into store blocks. The registry refactor
 * (tasks 1.5 and 1.6) must keep every one of these passing unchanged.
 */
describe("use-message-stream dispatch (characterization)", () => {
  it("message.delta appends text and agui.done completes the message", async () => {
    const assistant = await replay("t-text", [START, TEXT, DONE]);
    expect(assistant?.status).toBe("complete");
    expect(assistant?.content).toEqual([{ type: "text", text: "Hello" }]);
  });

  it.each(["agui.thinking.delta", "agui.reasoning.delta"])(
    "%s appends a reasoning block",
    async (event) => {
      const assistant = await replay(`t-${event}`, [
        START,
        { event, data: { kind: "thinking", phase: "delta", request_id: RID, delta: { text: "Hmm" } } },
        DONE,
      ]);
      expect(blocksOf(assistant?.content, "reasoning")).toEqual([{ type: "reasoning", text: "Hmm" }]);
    },
  );

  it("citation.added maps title, snippet and url to a citation block", async () => {
    const assistant = await replay("t-citation", [
      START,
      {
        event: "agui.citation.added",
        data: {
          kind: "citation",
          phase: "added",
          request_id: RID,
          citation: { index: 1, url: "https://know-me.tools/a", title: "Guide", snippet: "Snip" },
        },
      },
      DONE,
    ]);
    expect(blocksOf(assistant?.content, "citation")).toEqual([
      { type: "citation", source: "Guide", content: "Snip", url: "https://know-me.tools/a" },
    ]);
  });

  it("tool_call.delta/complete then tool_result builds one tool-call block", async () => {
    const assistant = await replay("t-tool", [
      START,
      {
        event: "agui.tool_call.delta",
        data: { kind: "tool_call", phase: "delta", request_id: RID, call_index: 0, id: "c1", delta: { arguments: "{\"q\":" } },
      },
      {
        event: "agui.tool_call.complete",
        data: { kind: "tool_call", phase: "complete", request_id: RID, call_index: 0, id: "c1", name: "search", arguments_json: "{\"q\":1}" },
      },
      {
        event: "agui.tool_result",
        data: { kind: "tool_result", request_id: RID, call_index: 0, id: "c1", name: "search", content: "ok", success: true },
      },
      DONE,
    ]);
    expect(blocksOf(assistant?.content, "tool-call")).toEqual([
      { type: "tool-call", toolCallId: "c1", toolName: "search", args: { q: 1 }, status: "complete", result: "ok" },
    ]);
  });

  it("tool_call.complete with unparseable arguments keeps them under _raw, and a failed result marks it failed", async () => {
    const assistant = await replay("t-tool-raw", [
      START,
      {
        event: "agui.tool_call.complete",
        data: { kind: "tool_call", phase: "complete", request_id: RID, call_index: 0, id: "c2", name: "x", arguments_json: "not json" },
      },
      {
        event: "agui.tool_result",
        data: { kind: "tool_result", request_id: RID, call_index: 0, id: "c2", name: "x", content: "boom", success: false },
      },
      DONE,
    ]);
    const [block] = blocksOf(assistant?.content, "tool-call");
    expect(block).toMatchObject({ args: { _raw: "not json" }, status: "failed", result: "boom" });
  });

  it("skill.activated adds a skill-activation block (finishStream marks it complete)", async () => {
    const assistant = await replay("t-skill", [
      START,
      {
        event: "agui.skill.activated",
        data: { kind: "skill", phase: "activated", request_id: RID, skill: { id: "s1", title: "Planner" }, selection_method: "skill_service.llm" },
      },
      DONE,
    ]);
    expect(blocksOf(assistant?.content, "skill-activation")).toEqual([
      { type: "skill-activation", skillId: "s1", skillName: "Planner", selectionMethod: "skill_service.llm", status: "complete" },
    ]);
  });

  it("context.update records only applied strategies", async () => {
    const ctx = (wasApplied: boolean): SseEvent => ({
      event: "agui.context.update",
      data: {
        kind: "context",
        phase: "update",
        strategy: "sliding_window",
        messages_removed: 2,
        tokens_saved: 100,
        was_applied: wasApplied,
        summary_generated: false,
      },
    });
    const assistant = await replay("t-ctx", [START, ctx(false), ctx(true), DONE]);
    expect(blocksOf(assistant?.content, "context-update")).toEqual([
      { type: "context-update", strategy: "sliding_window", messagesRemoved: 2, tokensSaved: 100, wasApplied: true, summaryGenerated: false },
    ]);
  });

  it("memory.recall and memory.mutation add memory blocks", async () => {
    const assistant = await replay("t-memory", [
      START,
      {
        event: "agui.memory.recall",
        data: { kind: "memory", phase: "recall", request_id: RID, items: [{ key: "k", value: "v", source: "memory_context", memory_type: "fact" }], count: 1 },
      },
      {
        event: "agui.memory.mutation",
        data: { kind: "memory", phase: "mutation", request_id: RID, operation: "add", memory_id: "m1", content: "c", scope: "user", memory_type: "fact" },
      },
      DONE,
    ]);
    expect(blocksOf(assistant?.content, "memory-recall")).toEqual([
      { type: "memory-recall", items: [{ key: "k", value: "v", source: "memory_context", scope: undefined, memoryType: "fact", importance: undefined }], count: 1 },
    ]);
    expect(blocksOf(assistant?.content, "memory-mutation")).toEqual([
      { type: "memory-mutation", operation: "add", memoryId: "m1", content: "c", scope: "user", memoryType: "fact" },
    ]);
  });

  it("artifact and artifact_input_request add artifact blocks", async () => {
    const assistant = await replay("t-artifact", [
      START,
      {
        event: "agui.artifact",
        data: { kind: "artifact", phase: "complete", request_id: RID, artifact_id: "a1", artifact_type: "code", title: "x.md", content: "- x", language: "markdown" },
      },
      {
        event: "agui.artifact_input_request",
        data: { kind: "artifact_input_request", request_id: RID, artifact_id: "a2", artifact_type: "confirm", title: "OK?", content: "{}" },
      },
      DONE,
    ]);
    expect(blocksOf(assistant?.content, "artifact")).toEqual([
      { type: "artifact", artifactId: "a1", artifactType: "code", title: "x.md", content: "- x", language: "markdown", isInputRequest: false, metadata: {} },
      { type: "artifact", artifactId: "a2", artifactType: "confirm", title: "OK?", content: "{}", isInputRequest: true, runId: RID, metadata: {} },
    ]);
  });

  it("custom with an embedded A2UI envelope becomes a display artifact; without one it is ignored", async () => {
    const envelope = { beginRendering: { surfaceId: "s1", root: "r" } };
    const assistant = await replay("t-custom", [
      START,
      TEXT,
      { event: "agui.custom", data: { kind: "custom", name: "a2ui", value: envelope } },
      { event: "agui.custom", data: { kind: "custom", name: "uar.rag.diagnostic", value: { code: "x", message: "y" } } },
      DONE,
    ]);
    const artifacts = blocksOf(assistant?.content, "artifact");
    expect(artifacts).toHaveLength(1);
    expect(artifacts[0]).toMatchObject({
      artifactType: "display",
      title: "Custom Event",
      content: JSON.stringify(envelope, null, 2),
      language: "json",
      isInputRequest: false,
    });
  });

  it("memory.update, state.patch and unknown agui events add no blocks", async () => {
    const assistant = await replay("t-ignored", [
      START,
      TEXT,
      { event: "agui.memory.update", data: { kind: "memory", phase: "update", request_id: RID, key: "k", value: "v", operation: "set" } },
      { event: "agui.state.patch", data: { kind: "state", phase: "patch", request_id: RID, patch: [{ op: "add", path: "/presentation", value: {} }] } },
      { event: "agui.totally.unknown", data: { kind: "mystery" } },
      DONE,
    ]);
    expect(assistant?.content).toEqual([{ type: "text", text: "Hello" }]);
  });

  it("agui.error fails the assistant message (characterization)", async () => {
    const assistant = await replay("t-error", [
      START,
      TEXT,
      { event: "agui.error", data: { kind: "error", request_id: RID, message: "boom" } },
    ]);
    expect(assistant?.status).toBe("failed");
  });
});

/** agui-render-registry tasks 1.4, 1.7, 1.8: behaviour added by the registry. */
describe("use-message-stream dispatch (registry)", () => {
  it("a turn that emits diagnostics stores no diagnostic artifacts (the live public-stream capture)", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const artifact = (artifact_type: string): SseEvent => ({
      event: "agui.artifact",
      data: {
        kind: "artifact",
        phase: "complete",
        request_id: RID,
        artifact_id: `a-${artifact_type}`,
        artifact_type,
        title: artifact_type,
        content: JSON.stringify({ model: "gpt-x" }),
        language: "json",
      },
    });
    const assistant = await replay("t-diagnostics", [
      START,
      { event: "runtime.run", data: { kind: "run", status: "started" } },
      TEXT,
      { event: "agui.state.patch", data: { kind: "state", phase: "patch", request_id: RID, patch: [{ op: "add", path: "/presentation", value: {} }] } },
      artifact("provider_event"),
      artifact("attempt_manifest"),
      artifact("effective_run_policy"),
      artifact("turn_manifest"),
      { event: "runtime.step", data: { kind: "step" } },
      { event: "agui.budget.alert", data: { kind: "budget", phase: "warning" } },
      DONE,
    ]);
    expect(assistant?.status).toBe("complete");
    expect(assistant?.content).toEqual([{ type: "text", text: "Hello" }]);
    // Every one of these has an entry: none is reported as unknown.
    expect(warn).not.toHaveBeenCalled();
  });

  it("an artifact of an unregistered type is hidden and warned about in development", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const assistant = await replay("t-unknown-artifact", [
      START,
      TEXT,
      {
        event: "agui.artifact",
        data: { kind: "artifact", phase: "complete", request_id: RID, artifact_id: "u1", artifact_type: "zz_unregistered", title: "x", content: "{}" },
      },
      DONE,
    ]);
    expect(blocksOf(assistant?.content, "artifact")).toEqual([]);
    expect(warn.mock.calls.some(([m]) => String(m).includes("zz_unregistered"))).toBe(true);
  });

  it("agui.cancelled shows a cancelled block with token usage only, and completes the message", async () => {
    const assistant = await replay("t-cancelled", [
      START,
      TEXT,
      {
        event: "agui.cancelled",
        data: {
          kind: "cancelled",
          request_id: RID,
          usage: { input_tokens: 120, output_tokens: 8, total_tokens: 128, cost_usd_estimate: 0.01, model: "gpt-x" },
        },
      },
    ]);
    expect(assistant?.status).toBe("complete");
    const [block] = blocksOf(assistant?.content, "tool-call");
    expect(block).toMatchObject({
      toolName: "__cancelled__",
      args: { usage: { input_tokens: 120, output_tokens: 8, total_tokens: 128 } },
    });
    expect(JSON.stringify(block)).not.toContain("gpt-x");
  });

  it("agui.rag_citations adds one citation block per citation", async () => {
    const assistant = await replay("t-rag", [
      START,
      TEXT,
      {
        event: "agui.rag_citations",
        data: {
          kind: "rag_citations",
          phase: "added",
          request_id: RID,
          citations: [
            { marker: 1, chunk_id: "c1", document_name: "handbook.pdf", relevance_score: 0.9, snippet: "First" },
            { marker: 2, chunk_id: "c2", document_name: "faq.md", relevance_score: 0.8, snippet: "Second" },
          ],
        },
      },
      DONE,
    ]);
    expect(blocksOf(assistant?.content, "citation")).toEqual([
      { type: "citation", source: "handbook.pdf", content: "First", url: undefined },
      { type: "citation", source: "faq.md", content: "Second", url: undefined },
    ]);
  });

  it("agui.subagent.* keeps one block per child thread and tracks its status", async () => {
    const lifecycle = (status: string) => ({
      child_thread_id: "child-1",
      canonical_path: "/root/research",
      status,
    });
    const assistant = await replay("t-subagent", [
      START,
      { event: "agui.subagent.started", data: { kind: "subagent", phase: "started", request_id: RID, lifecycle: lifecycle("running") } },
      { event: "agui.subagent.finished", data: { kind: "subagent", phase: "finished", request_id: RID, lifecycle: lifecycle("completed") } },
      TEXT,
      DONE,
    ]);
    const blocks = blocksOf(assistant?.content, "tool-call");
    expect(blocks).toHaveLength(1);
    expect(blocks[0]).toMatchObject({
      toolName: "__subagent__",
      args: { path: "/root/research", status: "complete" },
      status: "complete",
    });
  });

  it("agui.tool_call.approval_required adds a read-only approval block", async () => {
    const assistant = await replay("t-approval", [
      START,
      {
        event: "agui.tool_call.approval_required",
        data: {
          kind: "tool_call",
          phase: "approval_required",
          request_id: RID,
          approval_id: "ap1",
          call_index: 0,
          id: "c9",
          name: "send_email",
          arguments_json: "{}",
          risk_reason: "External side effect",
        },
      },
      DONE,
    ]);
    expect(blocksOf(assistant?.content, "tool-call")).toEqual([
      {
        type: "tool-call",
        toolCallId: "approval-c9",
        toolName: "__approval__",
        args: { toolName: "send_email", reason: "External side effect" },
        status: "running",
      },
    ]);
  });
});
