import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AI_DISCLOSURE_CONTENT } from "../../../content/site/ai-disclosure";
import { ComposerDisclosure } from "./enhanced-thread";

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
 * beyond this composer-level disclosure. The first-assistant-bubble decision
 * (`isFirstAssistantMessageIndex`) is tested in
 * `src/features/chat/first-assistant-message.test.ts`.
 */
describe("ComposerDisclosure", () => {
  it("renders the AI label and the sensitive-data hint from the static content source", () => {
    render(<ComposerDisclosure />);

    expect(screen.getByText(AI_DISCLOSURE_CONTENT.label)).toBeInTheDocument();
    expect(screen.getByText(AI_DISCLOSURE_CONTENT.sensitiveDataHint)).toBeInTheDocument();
  });
});
