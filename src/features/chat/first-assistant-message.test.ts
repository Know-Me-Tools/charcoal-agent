import { describe, expect, it } from "vitest";
import { isFirstAssistantMessageIndex } from "./first-assistant-message";

describe("isFirstAssistantMessageIndex", () => {
  it("is true only at the index of the first assistant message", () => {
    const messages = [
      { role: "user" },
      { role: "assistant" },
      { role: "user" },
      { role: "assistant" },
    ];

    expect(isFirstAssistantMessageIndex(messages, 1)).toBe(true);
    expect(isFirstAssistantMessageIndex(messages, 3)).toBe(false);
    expect(isFirstAssistantMessageIndex(messages, 0)).toBe(false);
  });

  it("is false for every index before any assistant message exists", () => {
    const messages = [{ role: "user" }];

    expect(isFirstAssistantMessageIndex(messages, 0)).toBe(false);
  });

  it("stays true for the first assistant message's index regardless of its streaming status", () => {
    // The decision is identity-based (position in the list), so it holds
    // before that message has any parts — i.e. before its first token.
    const messages = [{ role: "user" }, { role: "assistant" }];

    expect(isFirstAssistantMessageIndex(messages, 1)).toBe(true);
  });
});
