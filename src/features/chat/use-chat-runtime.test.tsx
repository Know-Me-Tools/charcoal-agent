import { describe, expect, it } from "vitest";

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

  it("groups consecutive citations into one Sources part, in arrival order", async () => {
    const { richMessageToThreadMessageLike } = await import("./use-chat-runtime");
    const assistant = richMessageToThreadMessageLike({
      id: "a2",
      role: "assistant",
      content: [
        { type: "text", text: "The answer." },
        { type: "citation", source: "a.md", content: "A", index: 1 },
        { type: "citation", source: "b.md", content: "B", url: "https://know-me.tools/b" },
        { type: "citation", source: "c.md", content: "C", index: 3 },
      ],
      // Rows rehydrated from PGlite can carry an ISO string.
      createdAt: "2026-09-01T00:00:02Z" as unknown as Date,
      status: "complete",
    });

    const parts = assistant.content as Array<{
      type: string;
      toolName?: string;
      toolCallId?: string;
      args?: { citations?: unknown[] };
    }>;
    expect(parts.map((p) => p.toolName ?? p.type)).toEqual(["text", "__citations__"]);
    expect(parts[1].args?.citations).toEqual([
      { source: "a.md", content: "A", url: undefined, index: 1 },
      { source: "b.md", content: "B", url: "https://know-me.tools/b", index: undefined },
      { source: "c.md", content: "C", url: undefined, index: 3 },
    ]);
  });

  it("keeps the group's id stable while citations stream in", async () => {
    const { richMessageToThreadMessageLike } = await import("./use-chat-runtime");
    const base = {
      id: "a3",
      role: "assistant" as const,
      createdAt: new Date("2026-09-01T00:00:03Z"),
      status: "in_progress" as const,
    };
    const one = richMessageToThreadMessageLike({
      ...base,
      content: [{ type: "citation", source: "a.md", content: "A" }],
    });
    const two = richMessageToThreadMessageLike({
      ...base,
      content: [
        { type: "citation", source: "a.md", content: "A" },
        { type: "citation", source: "b.md", content: "B" },
      ],
    });
    const idOf = (m: typeof one) =>
      (m.content as ReadonlyArray<{ toolCallId?: string }>)[0].toolCallId;
    expect(idOf(one)).toBe(idOf(two));
  });

  it("starts a new group when other content separates citations", async () => {
    const { richMessageToThreadMessageLike } = await import("./use-chat-runtime");
    const assistant = richMessageToThreadMessageLike({
      id: "a4",
      role: "assistant",
      content: [
        { type: "citation", source: "a.md", content: "A" },
        { type: "text", text: "Middle." },
        { type: "citation", source: "b.md", content: "B" },
      ],
      createdAt: new Date("2026-09-01T00:00:04Z"),
      status: "complete",
    });
    const parts = assistant.content as Array<{ type: string; toolName?: string; toolCallId?: string }>;
    expect(parts.map((p) => p.toolName ?? p.type)).toEqual(["__citations__", "text", "__citations__"]);
    expect(parts[0].toolCallId).not.toBe(parts[2].toolCallId);
  });
});
