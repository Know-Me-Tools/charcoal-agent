import { beforeEach, describe, expect, it, vi } from "vitest";

// PGlite is unavailable in jsdom; the store falls back to memory only.
vi.mock("@/lib/db/pglite", () => ({
  getDbInstance: () => {
    throw new Error("no db in tests");
  },
}));

const { useChatMessageStore } = await import("./chat-message-store");

const THREAD = "thread-1";
const RUN = "run-1";

function assistantBlocks() {
  const msgs = useChatMessageStore.getState().messagesByThread[THREAD] ?? [];
  const assistant = msgs.filter((m) => m.role === "assistant");
  expect(assistant).toHaveLength(1);
  return assistant[0].content.map((b) => b.type);
}

describe("chat-message-store stream ordering", () => {
  beforeEach(() => {
    useChatMessageStore.getState().clearThread(THREAD);
    useChatMessageStore.getState().initThread(THREAD, []);
    useChatMessageStore.getState().beginStream(THREAD, RUN);
  });

  it("keeps blocks that arrive before the first text or thinking token, in order", () => {
    const s = useChatMessageStore.getState();
    s.addSkillActivation(THREAD, { skillId: "knowme-profile", skillName: "KnowMe Profile", status: "active" });
    s.addContextUpdate(THREAD, {
      strategy: "summarize_oldest",
      messagesRemoved: 6,
      tokensSaved: 4210,
      wasApplied: true,
      summaryGenerated: true,
    });
    s.addMemoryRecall(THREAD, { items: [], count: 0 });
    s.addToolCall(THREAD, { type: "tool-call", toolCallId: "c1", toolName: "calendar", args: {}, status: "running" });
    s.appendTextDelta(THREAD, RUN, "Hello");

    expect(assistantBlocks()).toEqual([
      "skill-activation",
      "context-update",
      "memory-recall",
      "tool-call",
      "text",
    ]);
  });

  it("keeps citations, memory mutations and artifacts that precede text", () => {
    const s = useChatMessageStore.getState();
    s.addCitation(THREAD, { source: "Guide", content: "…" });
    s.addMemoryMutation(THREAD, { operation: "add", memoryId: "m1", content: "x", scope: "user", memoryType: "preference" });
    s.addArtifact(THREAD, {
      artifactId: "a1",
      artifactType: "code",
      title: "t",
      content: "c",
      isInputRequest: false,
      metadata: {},
    });
    expect(assistantBlocks()).toEqual(["citation", "memory-mutation", "artifact"]);
  });

  it("ignores block events when no stream is active", () => {
    const s = useChatMessageStore.getState();
    s.finishStream(THREAD);
    s.addSkillActivation(THREAD, { skillId: "x", skillName: "X", status: "active" });
    const msgs = useChatMessageStore.getState().messagesByThread[THREAD] ?? [];
    expect(msgs.flatMap((m) => m.content).some((b) => b.type === "skill-activation")).toBe(false);
  });
});

describe("chat-message-store setStreamError", () => {
  beforeEach(() => {
    useChatMessageStore.getState().clearThread(THREAD);
    useChatMessageStore.getState().initThread(THREAD, []);
  });

  it("creates a failed assistant message when the stream errors before any content block arrives", () => {
    const s = useChatMessageStore.getState();
    s.beginStream(THREAD, RUN);
    // No addToolCall/appendTextDelta/etc. — mirrors a pre-delta failure
    // (HTTP 500, a rejected fetch, or the stream closing with no events).

    s.setStreamError(THREAD, "POST /api/chat/completion 500: Internal Server Error");

    const msgs = useChatMessageStore.getState().messagesByThread[THREAD] ?? [];
    const assistant = msgs.filter((m) => m.role === "assistant");
    expect(assistant).toHaveLength(1);
    expect(assistant[0].status).toBe("failed");
    expect(assistant[0].content.map((b) => b.type)).toEqual(["error"]);
  });

  it("attaches to the existing streaming message instead of creating a second one when content already arrived", () => {
    const s = useChatMessageStore.getState();
    s.beginStream(THREAD, RUN);
    s.appendTextDelta(THREAD, RUN, "Partial reply");

    s.setStreamError(THREAD, "stream interrupted");

    const msgs = useChatMessageStore.getState().messagesByThread[THREAD] ?? [];
    const assistant = msgs.filter((m) => m.role === "assistant");
    expect(assistant).toHaveLength(1);
    expect(assistant[0].status).toBe("failed");
    expect(assistant[0].content.map((b) => b.type)).toEqual(["text", "error"]);
  });
});
