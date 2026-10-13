import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { useChatMessageStore } from "@/stores/chat-message-store";
import type { RichMessage } from "@/types/chat-content";
import { useThreadCitations } from "./use-thread-citations";

const THREAD = "thread-web-citations";

function assistant(id: string, content: RichMessage["content"]): RichMessage {
  return { id, role: "assistant", content, createdAt: new Date(0), status: "complete" };
}

beforeEach(() => {
  useChatMessageStore.setState({ messagesByThread: {} });
});

describe("useThreadCitations: web origin (site-web-search 16.8.2)", () => {
  it("keys by origin and marker: a web [W2] and a KB [2] stay separate, never renumbered", () => {
    useChatMessageStore.setState({
      messagesByThread: {
        [THREAD]: [
          assistant("m1", [
            { type: "citation", source: "faq.md", content: "", index: 2 },
            { type: "citation", source: "faq.md", content: "", index: 2, origin: "web", host: "faq.md" },
            { type: "citation", source: "Rust news", content: "", url: "https://example.org/r", index: 2, origin: "web", host: "example.org" },
          ]),
        ],
      },
    });
    const { result } = renderHook(() => useThreadCitations(THREAD));
    expect(result.current.map((c) => [c.origin, c.source, c.indices])).toEqual([
      ["kb", "faq.md", [2]],
      ["web", "faq.md", [2]],
      ["web", "Rust news", [2]],
    ]);
    expect(result.current[2].host).toBe("example.org");
  });

  it("keeps every web marker a source was cited under", () => {
    useChatMessageStore.setState({
      messagesByThread: {
        [THREAD]: [
          assistant("m1", [
            { type: "citation", source: "Rust news", content: "", url: "https://example.org/r", index: 1, origin: "web", host: "example.org" },
          ]),
          assistant("m2", [
            { type: "citation", source: "Rust news", content: "", url: "https://example.org/r", index: 3, origin: "web", host: "example.org" },
          ]),
        ],
      },
    });
    const { result } = renderHook(() => useThreadCitations(THREAD));
    expect(result.current).toHaveLength(1);
    expect(result.current[0].indices).toEqual([1, 3]);
  });
});
