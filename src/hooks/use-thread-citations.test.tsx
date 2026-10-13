import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { useChatMessageStore } from "@/stores/chat-message-store";
import type { RichMessage } from "@/types/chat-content";
import { useThreadCitations } from "./use-thread-citations";

const THREAD = "thread-citations";

function assistant(id: string, content: RichMessage["content"]): RichMessage {
  return { id, role: "assistant", content, createdAt: new Date(0), status: "complete" };
}

beforeEach(() => {
  useChatMessageStore.setState({ messagesByThread: {} });
});

describe("useThreadCitations", () => {
  it("carries the stream markers, so a merged source keeps every one", () => {
    useChatMessageStore.setState({
      messagesByThread: {
        [THREAD]: [
          assistant("m1", [
            { type: "citation", source: "a.md", content: "", index: 1 },
            { type: "citation", source: "b.md", content: "", url: "https://know-me.tools/b", index: 2 },
            { type: "citation", source: "b.md", content: "", url: "https://know-me.tools/b", index: 3 },
            { type: "citation", source: "c.md", content: "", index: 4 },
          ]),
        ],
      },
    });
    const { result } = renderHook(() => useThreadCitations(THREAD));
    expect(result.current.map((c) => [c.source, c.indices])).toEqual([
      ["a.md", [1]],
      ["b.md", [2, 3]],
      ["c.md", [4]],
    ]);
  });

  it("falls back to the position in the reply when the stream sent no marker", () => {
    useChatMessageStore.setState({
      messagesByThread: {
        [THREAD]: [
          assistant("m1", [
            { type: "text", text: "x" },
            { type: "citation", source: "a.md", content: "" },
            { type: "citation", source: "b.md", content: "" },
          ]),
        ],
      },
    });
    const { result } = renderHook(() => useThreadCitations(THREAD));
    expect(result.current.map((c) => c.indices)).toEqual([[1], [2]]);
  });
});
