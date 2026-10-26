/**
 * Site composer length counter (site-composer-limit). The server rejects a
 * message over 4,000 characters; the counter starts at 3,200, turns to a clear
 * over-limit state past 4,000, and keeps its screen-reader announcement to
 * steps of 100 so typing is not read out keystroke by keystroke.
 */
import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { COMPOSER_LIMIT_CONTENT } from "../../../content/site/composer-limit";

const draft = vi.hoisted(() => ({ text: "" }));

vi.mock("@assistant-ui/react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@assistant-ui/react")>();
  return {
    ...actual,
    useAuiState: (selector: (state: unknown) => unknown) => selector({ composer: { text: draft.text } }),
  };
});

import { countComposerChars } from "@/features/chat/composer-limit";
import { ComposerLengthCounter } from "./composer-length";

const c = COMPOSER_LIMIT_CONTENT;
const text = (n: number) => "a".repeat(n);
const live = () => screen.getByRole("status");

afterEach(() => {
  draft.text = "";
});

describe("countComposerChars", () => {
  it("counts an emoji as one character, the way the server does", () => {
    expect(countComposerChars("😀".repeat(3300))).toBe(3300);
    expect(countComposerChars("short")).toBe(5);
  });
});

describe("ComposerLengthCounter", () => {
  it("states the agreed limits", () => {
    expect(c.limit).toBe(4000);
    expect(c.showFrom).toBe(3200);
    expect(c.tooLongNotice.body).toContain("4,000");
  });

  it("shows nothing below 3,200 characters, with an empty live region ready", () => {
    draft.text = text(3199);
    render(<ComposerLengthCounter />);
    expect(screen.queryByRole("group", { name: c.counterLabel })).toBeNull();
    expect(live()).toBeEmptyDOMElement();
  });

  it("appears at 3,200 with the characters left and the summarise hint", () => {
    draft.text = text(3200);
    render(<ComposerLengthCounter />);
    const group = screen.getByRole("group", { name: c.counterLabel });
    expect(group).toHaveAttribute("data-state", "near");
    expect(group).toHaveTextContent(c.remaining(800));
    expect(group).toHaveTextContent(c.hint);
    expect(live()).toHaveTextContent(c.liveRemaining(800));
  });

  it("is still within the limit at exactly 4,000, in the warning state", () => {
    draft.text = text(4000);
    render(<ComposerLengthCounter />);
    const group = screen.getByRole("group", { name: c.counterLabel });
    expect(group).toHaveAttribute("data-state", "warn");
    expect(group).toHaveTextContent(c.remaining(0));
  });

  it("turns to the over-limit state at 4,001 and says by how much", () => {
    draft.text = text(4100);
    render(<ComposerLengthCounter />);
    const group = screen.getByRole("group", { name: c.counterLabel });
    expect(group).toHaveAttribute("data-state", "over");
    expect(group).toHaveTextContent(c.over(100));
    expect(group).toHaveTextContent(c.hintOver);
    expect(live()).toHaveTextContent(c.liveOver);
  });

  it("keeps the announcement the same across a whole 100-character step", () => {
    draft.text = text(3850);
    const { rerender } = render(<ComposerLengthCounter />);
    const first = live().textContent;
    draft.text = text(3860);
    rerender(<ComposerLengthCounter />);
    expect(live().textContent).toBe(first);
    expect(first).toBe(c.liveRemaining(200));
  });

  it("hides the per-keystroke count from assistive technology and announces politely", () => {
    draft.text = text(3500);
    render(<ComposerLengthCounter />);
    expect(screen.getByText(c.remaining(500))).toHaveAttribute("aria-hidden", "true");
    expect(live()).toHaveAttribute("aria-live", "polite");
  });

  it("uses singular wording for one character", () => {
    expect(c.remaining(1)).toBe("1 character left");
    expect(c.over(1)).toBe("1 character over");
    expect(c.remaining(1000)).toBe("1,000 characters left");
  });
});
