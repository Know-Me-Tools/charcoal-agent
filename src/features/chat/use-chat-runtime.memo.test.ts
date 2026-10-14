import { beforeEach, describe, expect, it, vi } from "vitest";
import type { RichMessage } from "@/types/chat-content";

// PGlite is unavailable in jsdom; the store falls back to memory only.
// Same pattern as src/stores/chat-message-store.test.ts.
vi.mock("@/lib/db/pglite", () => ({
  getDbInstance: () => {
    throw new Error("no db in tests");
  },
  whenDbReady: () => new Promise<never>(() => {}),
}));

const { useChatMessageStore } = await import("@/stores/chat-message-store");
const { richMessageToThreadMessageLike, createMemoizedConverter } =
  await import("./use-chat-runtime");

const THREAD = "memo-thread";
const RUN = "memo-run";

function completeMessage(
  id: string,
  role: RichMessage["role"],
  text: string,
  atSeconds: number,
): RichMessage {
  return {
    id,
    role,
    content: [{ type: "text", text }],
    createdAt: new Date(Date.UTC(2026, 8, 1, 0, 0, atSeconds)),
    status: "complete",
  };
}

describe("memoized thread-message conversion", () => {
  beforeEach(() => {
    useChatMessageStore.getState().clearThread(THREAD);
  });

  it("rebuilds only the streaming message when a text delta lands on it", () => {
    let conversions = 0;
    const convert = createMemoizedConverter((msg) => {
      conversions += 1;
      return richMessageToThreadMessageLike(msg);
    });

    // 49 settled messages, then a streaming 50th.
    const store = useChatMessageStore.getState();
    store.initThread(
      THREAD,
      Array.from({ length: 49 }, (_, i) =>
        completeMessage(
          `m${i}`,
          i % 2 === 0 ? "user" : "assistant",
          `message ${i}`,
          i,
        ),
      ),
    );
    store.beginStream(THREAD, RUN);
    store.appendTextDelta(THREAD, RUN, "Hello");

    const beforeInput =
      useChatMessageStore.getState().messagesByThread[THREAD];
    expect(beforeInput).toHaveLength(50);

    const beforeOutput = beforeInput.map(convert);
    expect(conversions).toBe(50);

    // The streaming flush: one text delta appended to the last message.
    useChatMessageStore.getState().appendTextDelta(THREAD, RUN, " world");

    const afterInput =
      useChatMessageStore.getState().messagesByThread[THREAD];
    expect(afterInput).toHaveLength(50);

    // Immer structural sharing, verified not assumed: only the message the
    // delta landed on got a new object.
    for (let i = 0; i < 49; i += 1) {
      expect(afterInput[i]).toBe(beforeInput[i]);
    }
    expect(afterInput[49]).not.toBe(beforeInput[49]);

    const afterOutput = afterInput.map(convert);

    // The conversion ran for exactly one message, and the earlier 49 keep
    // identical output object identity.
    expect(conversions).toBe(51);
    for (let i = 0; i < 49; i += 1) {
      expect(afterOutput[i]).toBe(beforeOutput[i]);
    }
    expect(afterOutput[49]).not.toBe(beforeOutput[49]);

    // The rebuilt message carries the appended text.
    const parts = afterOutput[49].content as ReadonlyArray<{
      type: string;
      text?: string;
    }>;
    expect(parts.find((p) => p.type === "text")?.text).toBe("Hello world");
  });

  it("produces output deeply equal to the plain converter across block kinds", () => {
    const memoized = createMemoizedConverter();

    const corpus: RichMessage[] = [
      completeMessage("u1", "user", "What can you do?", 0),
      {
        id: "a1",
        role: "assistant",
        createdAt: new Date("2026-09-01T00:00:01Z"),
        status: "complete",
        content: [
          { type: "reasoning", text: "Thinking aloud." },
          { type: "text", text: "The answer." },
          { type: "citation", source: "guide.md", content: "A", index: 1 },
          {
            type: "citation",
            source: "Example",
            content: "B",
            url: "https://example.com/b",
            index: 2,
            origin: "web",
            host: "example.com",
          },
          { type: "step", index: 0, phase: "finished", label: "Search" },
          { type: "step", index: 1, phase: "finished", label: "Read" },
          // A step still "started" in a settled message is finalized.
          { type: "step", index: 2, phase: "started", label: "Write" },
          {
            type: "artifact",
            artifactId: "art-1",
            artifactType: "code",
            title: "Snippet",
            content: "const x = 1;",
            language: "ts",
            isInputRequest: false,
          },
          {
            type: "artifact",
            artifactId: "art-2",
            artifactType: "form",
            title: "Details",
            content: "{}",
            isInputRequest: true,
            runId: "run-1",
            metadata: { prompt: "Fill this in" },
          },
          {
            type: "tool-call",
            toolCallId: "tc-1",
            toolName: "calendar",
            args: { day: "today" },
            status: "running",
          },
          {
            type: "tool-call",
            toolCallId: "tc-2",
            toolName: "delete_all",
            args: {},
            result: "Refused by policy",
            status: "denied",
          },
          {
            type: "skill-activation",
            skillId: "knowme-profile",
            skillName: "KnowMe Profile",
            status: "active",
          },
          {
            type: "memory-recall",
            items: [{ key: "k", value: "v", source: "chat" }],
            count: 1,
          },
          {
            type: "memory-mutation",
            operation: "add",
            memoryId: "mem-1",
            content: "likes tea",
            scope: "user",
            memoryType: "preference",
          },
          {
            type: "context-update",
            strategy: "summarize_oldest",
            messagesRemoved: 6,
            tokensSaved: 4210,
            wasApplied: true,
            summaryGenerated: true,
          },
          // Skipped blocks must stay skipped identically.
          { type: "image", url: "https://know-me.tools/x.png" },
          { type: "error", message: "boom" },
        ],
      },
      {
        // A cancelled reply: the client-side Stop stores a __cancelled__
        // tool-call block (see use-chat-runtime's onCancel).
        id: "a2",
        role: "assistant",
        createdAt: new Date("2026-09-01T00:00:02Z"),
        status: "complete",
        content: [
          { type: "text", text: "Partial ans" },
          {
            type: "tool-call",
            toolCallId: "cancelled-1",
            toolName: "__cancelled__",
            args: {},
            status: "complete",
          },
        ],
      },
      {
        // Settled with an ISO-string createdAt, as PGlite rows rehydrate.
        id: "a3",
        role: "assistant",
        createdAt: "2026-09-01T00:00:03Z" as unknown as Date,
        status: "failed",
        content: [{ type: "error", message: "The reply stopped." }],
      },
      {
        // An empty in-progress assistant turn.
        id: "a4",
        role: "assistant",
        createdAt: new Date("2026-09-01T00:00:04Z"),
        status: "in_progress",
        content: [],
      },
    ];

    for (const msg of corpus) {
      const direct = richMessageToThreadMessageLike(msg);
      const viaMemo = memoized(msg);
      expect(viaMemo).toEqual(direct);
      // Cached: a second pass returns the identical object.
      expect(memoized(msg)).toBe(viaMemo);
    }
  });
});
