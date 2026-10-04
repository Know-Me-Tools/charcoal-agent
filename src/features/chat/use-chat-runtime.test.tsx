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
});
