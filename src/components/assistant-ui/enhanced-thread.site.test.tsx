/**
 * Site-build empty state and composer (site-shell-about-panel-and-empty-state,
 * task 6.3). The site shows its own DRAFT copy from
 * `content/site/empty-state.ts`, reuses the AI disclosure label rather than
 * restating it, and drops the app's stale "act on your behalf" promise. The
 * site composer has the site placeholder and no prompt-caching toggle. The
 * app build is unchanged.
 */
import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { APPROVED_TAGLINES } from "../../../content/brand/taglines";
import { AI_DISCLOSURE_CONTENT } from "../../../content/site/ai-disclosure";
import { EMPTY_STATE_CONTENT } from "../../../content/site/empty-state";

type Props = { children?: ReactNode } & Record<string, unknown>;

const append = vi.hoisted(() => vi.fn());

vi.mock("@assistant-ui/react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@assistant-ui/react")>();
  const passthrough = ({ children }: Props) => <>{children}</>;
  const box = ({ children, ...props }: Props) => <div {...props}>{children}</div>;
  return {
    ...actual,
    useAui: () => ({ thread: () => ({ append }) }),
    AuiIf: passthrough,
    ThreadPrimitive: {
      ...actual.ThreadPrimitive,
      ScrollToBottom: passthrough,
    },
    ComposerPrimitive: {
      ...actual.ComposerPrimitive,
      Root: box,
      AttachmentDropzone: box,
      Input: (props: Record<string, unknown>) => <textarea {...props} />,
      Send: passthrough,
      Cancel: passthrough,
    },
  };
});
vi.mock("@/components/assistant-ui/attachment", () => ({
  ComposerAttachments: () => null,
  ComposerAddAttachment: () => null,
  UserMessageAttachments: () => null,
}));

import { ComposerDisclosure, EnhancedComposer, ThreadScrollToBottom, ThreadWelcome } from "./enhanced-thread";

const SITE_AGENT = "knowme-site";
const STALE_APP_COPY = /no threads yet|act on your behalf|start a new thread/i;

afterEach(() => {
  vi.unstubAllEnvs();
  append.mockClear();
});

describe("ThreadWelcome on the site build", () => {
  it("shows the site heading and description, without stale app copy", () => {
    vi.stubEnv("VITE_SITE_AGENT_ID", SITE_AGENT);
    render(<ThreadWelcome />);

    expect(screen.getByRole("heading", { level: 1, name: EMPTY_STATE_CONTENT.heading })).toBeInTheDocument();
    expect(screen.getByText(EMPTY_STATE_CONTENT.description)).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(STALE_APP_COPY);
  });

  // site-concierge-opening: the opening covers the portfolio, not three products.
  it("opens on the whole portfolio and says what it answers from", () => {
    const text = EMPTY_STATE_CONTENT.description;
    for (const family of ["apps", "agents and memory", "platform", "developer tools", "integrations", "services and research"]) {
      expect(text).toContain(family);
    }
    expect(text).toMatch(/knowledge base/i);
    expect(text).toMatch(/proposed/i);
    expect(text).not.toMatch(/The Boss|BossFang|Surreal|IPFS/);
  });

  it("offers 4 to 6 starter prompts that follow the prompt rules", () => {
    const prompts = EMPTY_STATE_CONTENT.starterPrompts;
    expect(prompts.length).toBeGreaterThanOrEqual(4);
    expect(prompts.length).toBeLessThanOrEqual(6);
    expect(new Set(prompts).size).toBe(prompts.length);
    for (const p of prompts) {
      expect(p.endsWith("?")).toBe(true);
      expect(p.length).toBeLessThanOrEqual(70);
      expect(p).not.toMatch(/\$|price|pricing|best|fastest|only|seamless|cutting-edge|leverage|utilize|synergy|certif|complian/i);
    }
  });

  it("shows one 44 px chip per starter prompt, named by the whole question", () => {
    vi.stubEnv("VITE_SITE_AGENT_ID", SITE_AGENT);
    render(<ThreadWelcome />);
    for (const p of EMPTY_STATE_CONTENT.starterPrompts) {
      expect(screen.getByRole("button", { name: p }).className).toContain("min-h-11");
    }
    expect(screen.getAllByRole("button")).toHaveLength(EMPTY_STATE_CONTENT.starterPrompts.length);
  });

  it("sends a chip's question as the first user message in the open thread", () => {
    vi.stubEnv("VITE_SITE_AGENT_ID", SITE_AGENT);
    render(<ThreadWelcome />);
    const prompt = EMPTY_STATE_CONTENT.starterPrompts[1];
    fireEvent.click(screen.getByRole("button", { name: prompt }));
    expect(append).toHaveBeenCalledTimes(1);
    expect(append).toHaveBeenCalledWith({ role: "user", content: [{ type: "text", text: prompt }] });
  });

  // Integration gate 08, C1: the empty state showed the AI label twice, once
  // here and once in the composer disclosure right below. The composer copy
  // stays (it is visible before the first token); the welcome copy goes.
  it("does not repeat the AI label that the composer disclosure already shows", () => {
    vi.stubEnv("VITE_SITE_AGENT_ID", SITE_AGENT);
    render(
      <>
        <ThreadWelcome />
        <ComposerDisclosure />
      </>,
    );
    expect(screen.getAllByText(AI_DISCLOSURE_CONTENT.label)).toHaveLength(1);
    expect(screen.getByText(AI_DISCLOSURE_CONTENT.sensitiveDataHint)).toBeInTheDocument();
  });

  it("uses an approved tagline, verbatim, as its heading", () => {
    expect(APPROVED_TAGLINES).toContain(EMPTY_STATE_CONTENT.heading);
  });
});

describe("ThreadWelcome on the app build", () => {
  it("is unchanged", () => {
    vi.stubEnv("VITE_SITE_AGENT_ID", "");
    render(<ThreadWelcome />);
    expect(screen.getByRole("heading", { level: 1, name: "KnowMe" })).toBeInTheDocument();
    expect(document.body.textContent).toMatch(/no threads yet/i);
    expect(screen.queryByText(EMPTY_STATE_CONTENT.description)).toBeNull();
    expect(screen.queryByRole("button")).toBeNull();
  });
});

describe("EnhancedComposer", () => {
  it("on the site build: site placeholder and no prompt-caching toggle", () => {
    vi.stubEnv("VITE_SITE_AGENT_ID", SITE_AGENT);
    render(<EnhancedComposer onTogglePromptCaching={() => undefined} />);
    expect(screen.getByRole("textbox", { name: "Message input" })).toHaveAttribute(
      "placeholder",
      EMPTY_STATE_CONTENT.composerPlaceholder,
    );
    expect(screen.queryByRole("button", { name: /prompt caching/i })).toBeNull();
  });

  it("on the app build: agent placeholder and the prompt-caching toggle", () => {
    vi.stubEnv("VITE_SITE_AGENT_ID", "");
    render(<EnhancedComposer onTogglePromptCaching={() => undefined} />);
    expect(screen.getByRole("textbox", { name: "Message input" })).toHaveAttribute(
      "placeholder",
      "Ask your agent anything…",
    );
    expect(screen.getByRole("button", { name: /prompt caching/i })).toBeInTheDocument();
  });
});

// Integration gate 08, S3: the jump-to-bottom button floated over the thread
// (`absolute -top-12`) and covered answer-card text at 320 and 1024. jsdom has
// no layout, so these assert the layout contract; the overlap itself is only
// observable in a browser capture.
describe("ThreadScrollToBottom", () => {
  it("on the site build: in the footer's flow while shown, removed from layout at the bottom", () => {
    vi.stubEnv("VITE_SITE_AGENT_ID", SITE_AGENT);
    render(<ThreadScrollToBottom />);
    const button = screen.getByRole("button", { name: "Scroll to bottom" });
    expect(button.className).not.toMatch(/(^|\s)absolute(\s|$)/);
    expect(button.className).not.toMatch(/-top-12/);
    expect(button.className).toMatch(/(^|\s)disabled:hidden(\s|$)/);
    expect(button.className).not.toMatch(/disabled:invisible/);
  });

  it("on the app build: unchanged, floating above the footer", () => {
    vi.stubEnv("VITE_SITE_AGENT_ID", "");
    render(<ThreadScrollToBottom />);
    const button = screen.getByRole("button", { name: "Scroll to bottom" });
    expect(button.className).toMatch(/(^|\s)absolute(\s|$)/);
    expect(button.className).toMatch(/-top-12/);
    expect(button.className).toMatch(/disabled:invisible/);
  });
});
