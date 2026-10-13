/**
 * Site-build empty state and composer (site-shell-about-panel-and-empty-state,
 * task 6.3). The site shows its own DRAFT copy from
 * `content/site/empty-state.ts`, reuses the AI disclosure label rather than
 * restating it, and drops the app's stale "act on your behalf" promise. The
 * site composer has the site placeholder and no prompt-caching toggle. The
 * app build is unchanged.
 */
import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { APPROVED_TAGLINES } from "../../../content/brand/taglines";
import { AI_DISCLOSURE_CONTENT } from "../../../content/site/ai-disclosure";
import { EMPTY_STATE_CONTENT } from "../../../content/site/empty-state";

type Props = { children?: ReactNode } & Record<string, unknown>;

vi.mock("@assistant-ui/react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@assistant-ui/react")>();
  const passthrough = ({ children }: Props) => <>{children}</>;
  const box = ({ children, ...props }: Props) => <div {...props}>{children}</div>;
  return {
    ...actual,
    AuiIf: passthrough,
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

import { EnhancedComposer, ThreadWelcome } from "./enhanced-thread";

const SITE_AGENT = "knowme-site";
const STALE_APP_COPY = /no threads yet|act on your behalf|start a new thread/i;

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("ThreadWelcome on the site build", () => {
  it("shows the site heading, description and the shared AI disclosure, without stale app copy", () => {
    vi.stubEnv("VITE_SITE_AGENT_ID", SITE_AGENT);
    render(<ThreadWelcome />);

    expect(screen.getByRole("heading", { level: 1, name: EMPTY_STATE_CONTENT.heading })).toBeInTheDocument();
    expect(screen.getByText(EMPTY_STATE_CONTENT.description)).toBeInTheDocument();
    expect(screen.getByText(AI_DISCLOSURE_CONTENT.label)).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(STALE_APP_COPY);
    // Starter prompts are a later change (07): no chips yet.
    expect(screen.queryByRole("button")).toBeNull();
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
