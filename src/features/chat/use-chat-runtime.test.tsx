import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { toSseBody } from "../../../e2e/fixtures/sse";
import { createGraphTestHarness } from "@/test/utils/graph-wrapper";
import { mockFetch, type FetchMock } from "@/test/utils/mock-fetch";
import { useChatIntentStore } from "@/stores/chat-intent-store";

// PGlite is not available in jsdom; stores fall back gracefully without it.
vi.mock("@/lib/db/pglite", () => ({
  getDbInstance: () => {
    throw new Error("no db in tests");
  },
}));

const { useChatRuntime } = await import("./use-chat-runtime");

let fetchMock: FetchMock;
afterEach(() => fetchMock?.restore());

describe("useChatRuntime after a completed stream", () => {
  it("marks the thread's server transcript stale", async () => {
    const threadId = "11111111-2222-4333-8444-555555555555";
    fetchMock = mockFetch({
      "POST /api/chat/completion": (req) =>
        (req.body as { stream?: boolean }).stream === false
          ? { body: { content: "Weekly plan" } }
          : { raw: toSseBody() },
    });
    const { wrapper, store } = createGraphTestHarness();
    store.getState().upsertEntity("SessionTranscript", threadId, { id: threadId, messages: [] });
    store.getState().setEntityFetched("SessionTranscript", threadId);
    useChatIntentStore.getState().setPendingPrompt("Plan my week");

    renderHook(() => useChatRuntime(threadId), { wrapper });

    await waitFor(() =>
      expect(store.getState().entityStates[`SessionTranscript:${threadId}`]?.stale).toBe(true),
    );
  });
});

describe("richMessageToThreadMessageLike", () => {
  it("gives every message metadata and user messages an attachments array", async () => {
    const { richMessageToThreadMessageLike } = await import("./use-chat-runtime");
    const user = richMessageToThreadMessageLike({
      id: "u1",
      role: "user",
      content: [{ type: "text", text: "hi" }],
      createdAt: new Date("2026-09-01T00:00:00Z"),
      status: "complete",
    });
    const assistant = richMessageToThreadMessageLike({
      id: "a1",
      role: "assistant",
      content: [
        { type: "skill-activation", skillId: "s", skillName: "S", status: "active" },
        { type: "text", text: "ok" },
      ],
      createdAt: new Date("2026-09-01T00:00:01Z"),
      status: "complete",
    });

    expect(user.metadata).toBeDefined();
    expect(user.attachments).toEqual([]);
    expect(assistant.metadata).toBeDefined();
    const parts = assistant.content as Array<{ type: string; toolName?: string }>;
    expect(parts.map((p) => p.toolName ?? p.type)).toEqual(["__skill__", "text"]);
  });
});
