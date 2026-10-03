import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AI_DISCLOSURE_CONTENT } from "../../../content/site/ai-disclosure";
import { ComposerDisclosure, isFirstAssistantMessageIndex } from "./enhanced-thread";

/**
 * FR-31/FR-35 (site-ai-disclosure-label). `ComposerDisclosure` is a pure,
 * statically-sourced component — rendering it needs no AssistantRuntimeProvider,
 * matching how `MessageError`/`EditComposer` are tested directly elsewhere in
 * this file's sibling suite. The DOM-level guarantee that every
 * `data-role="assistant"` element also carries `data-ai-generated="true"` is
 * exercised against the real running app in
 * openspec/changes/site-ai-disclosure-label task 1.9 (Playwright) — that
 * attribute is an unconditional literal on `AssistantMessage`'s single
 * `MessagePrimitive.Root`, not logic, so there is nothing to unit-test there
 * beyond the two pieces covered here: the composer-level disclosure, and the
 * first-assistant-bubble decision below.
 */
describe("ComposerDisclosure", () => {
  it("renders the AI label and the sensitive-data hint from the static content source", () => {
    render(<ComposerDisclosure />);

    expect(screen.getByText(AI_DISCLOSURE_CONTENT.label)).toBeInTheDocument();
    expect(screen.getByText(AI_DISCLOSURE_CONTENT.sensitiveDataHint)).toBeInTheDocument();
  });
});

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
