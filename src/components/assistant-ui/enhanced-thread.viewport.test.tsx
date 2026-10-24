/**
 * Site-build thread viewport and phone chrome (critique batch B: P1-2, P1-3,
 * P2-6, P2-7 and the P1-5 slot). jsdom has no layout, so these assert the
 * contract (a spacer exists, the footer height is published, classes and
 * attributes are set, the app build is unchanged). The visual result at
 * 320/768/1440 is only provable in a browser capture.
 */
import { fireEvent, render, renderHook, screen, within } from "@testing-library/react";
import { EMPTY_STATE_CONTENT } from "../../../content/site/empty-state";
import { MemoryRouter } from "react-router-dom";
import { useRef, type ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type Props = { children?: ReactNode } & Record<string, unknown>;

const phone = vi.hoisted(() => ({ value: false }));
vi.mock("@/hooks/use-mobile", () => ({ useIsMobile: () => phone.value }));

vi.mock("@assistant-ui/react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@assistant-ui/react")>();
  const passthrough = ({ children }: Props) => <>{children}</>;
  const box = ({ children, ...props }: Props) => <div {...props}>{children}</div>;
  return {
    ...actual,
    AuiIf: passthrough,
    ComposerPrimitive: {
      ...actual.ComposerPrimitive,
      Root: ({ children, ...props }: Props) => <form {...props}>{children}</form>,
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

import {
  CHAT_ACTIVE_ATTRIBUTE,
  EnhancedComposer,
  StarterPromptSlot,
  SiteWelcomeHeading,
  isChatActive,
  ThreadWelcome,
  useFooterHeightVar,
} from "./enhanced-thread";
import { TooltipIconButton } from "./tooltip-icon-button";
import { MobileBottomNav } from "@/components/layout/mobile-nav";

const SITE_AGENT = "knowme-site";

beforeEach(() => {
  phone.value = false;
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("isChatActive (tab bar rule)", () => {
  it("is active only while focused and (running or typing)", () => {
    expect(isChatActive({ composerFocused: true, isRunning: true, hasText: false })).toBe(true);
    expect(isChatActive({ composerFocused: true, isRunning: false, hasText: true })).toBe(true);
  });
  it("lets the bar return after a reply when the focused composer is empty", () => {
    expect(isChatActive({ composerFocused: true, isRunning: false, hasText: false })).toBe(false);
  });
  it("is inactive without focus, even mid-run or with text", () => {
    expect(isChatActive({ composerFocused: false, isRunning: true, hasText: true })).toBe(false);
  });
});

describe("SiteWelcomeHeading", () => {
  it("keeps the last two words together without changing the copy", () => {
    const { container } = render(<SiteWelcomeHeading text="AI that understands you." />);
    expect(container.textContent).toBe("AI that understands you.");
    const tail = container.querySelector("span.whitespace-nowrap");
    expect(tail?.textContent).toBe("understands you.");
  });
});

describe("useFooterHeightVar (P1-2)", () => {
  class FakeResizeObserver {
    static instances: FakeResizeObserver[] = [];
    constructor(readonly callback: () => void) {
      FakeResizeObserver.instances.push(this);
    }
    observe = vi.fn();
    disconnect = vi.fn();
  }

  function setup(enabled: boolean) {
    const host = document.createElement("div");
    const footer = document.createElement("div");
    Object.defineProperty(footer, "offsetHeight", { configurable: true, value: 172 });
    host.appendChild(footer);
    const hook = renderHook(() => {
      const ref = useRef<HTMLElement | null>(footer);
      useFooterHeightVar(ref, enabled);
    });
    return { host, hook };
  }

  beforeEach(() => {
    FakeResizeObserver.instances = [];
    vi.stubGlobal("ResizeObserver", FakeResizeObserver);
  });

  it("publishes the footer height on its parent and clears it on unmount", () => {
    const { host, hook } = setup(true);
    expect(host.style.getPropertyValue("--thread-footer-h")).toBe("172px");
    hook.unmount();
    expect(host.style.getPropertyValue("--thread-footer-h")).toBe("");
    expect(FakeResizeObserver.instances[0].disconnect).toHaveBeenCalled();
  });

  it("does nothing when disabled (app build)", () => {
    const { host } = setup(false);
    expect(host.style.getPropertyValue("--thread-footer-h")).toBe("");
    expect(FakeResizeObserver.instances).toHaveLength(0);
  });
});

describe("EnhancedComposer chrome (P1-3, P2-6, P2-7)", () => {
  it("site build at 320: one-line input, 44px send target, no autofocus", () => {
    vi.stubEnv("VITE_SITE_AGENT_ID", SITE_AGENT);
    phone.value = true;
    render(<EnhancedComposer />);
    const input = screen.getByRole("textbox", { name: "Message input" });
    expect(input.className).toMatch(/(^|\s)min-h-11(\s|$)/);
    expect(input.className).toMatch(/md:min-h-14/);
    expect(input.className).not.toMatch(/(^|\s)min-h-14(\s|$)/);
    expect(input).not.toHaveFocus();
    expect(screen.getByRole("button", { name: "Send message" }).className).toContain("max-md:size-11");
  });

  it("site build from 768: autofocus stays", () => {
    vi.stubEnv("VITE_SITE_AGENT_ID", SITE_AGENT);
    phone.value = false;
    render(<EnhancedComposer />);
    expect(screen.getByRole("textbox", { name: "Message input" })).toHaveFocus();
  });

  it("app build: min-h-14, autofocus and 32px send target unchanged", () => {
    vi.stubEnv("VITE_SITE_AGENT_ID", "");
    phone.value = true;
    render(<EnhancedComposer />);
    const input = screen.getByRole("textbox", { name: "Message input" });
    expect(input.className).toMatch(/(^|\s)min-h-14(\s|$)/);
    expect(input.className).not.toContain("min-h-11");
    expect(input).toHaveFocus();
    expect(screen.getByRole("button", { name: "Send message" }).className).not.toContain("max-md:size-11");
  });

  it("reports focus entering and leaving the composer", () => {
    vi.stubEnv("VITE_SITE_AGENT_ID", SITE_AGENT);
    phone.value = true;
    const onFocusWithinChange = vi.fn();
    render(<EnhancedComposer onFocusWithinChange={onFocusWithinChange} />);
    const input = screen.getByRole("textbox", { name: "Message input" });
    fireEvent.focus(input);
    expect(onFocusWithinChange).toHaveBeenLastCalledWith(true);
    fireEvent.blur(input, { relatedTarget: document.body });
    expect(onFocusWithinChange).toHaveBeenLastCalledWith(false);
  });
});

describe("TooltipIconButton target size (P2-6)", () => {
  it("site build: 44px below 768", () => {
    vi.stubEnv("VITE_SITE_AGENT_ID", SITE_AGENT);
    render(<TooltipIconButton tooltip="Copy" />);
    expect(screen.getByRole("button", { name: /Copy/ }).className).toContain("max-md:size-11");
  });

  it("app build: unchanged", () => {
    vi.stubEnv("VITE_SITE_AGENT_ID", "");
    render(<TooltipIconButton tooltip="Copy" />);
    expect(screen.getByRole("button", { name: /Copy/ }).className).not.toContain("max-md:size-11");
  });
});

describe("Starter prompt slot (P1-5)", () => {
  it("is in the site empty state and holds the starter prompts as buttons", () => {
    vi.stubEnv("VITE_SITE_AGENT_ID", SITE_AGENT);
    const { container } = render(<ThreadWelcome />);
    const slot = container.querySelector("[data-slot='starter-prompts']");
    expect(slot).not.toBeNull();
    expect(slot?.className).toContain("min-h-11");
    expect(within(slot as HTMLElement).getAllByRole("button")).toHaveLength(EMPTY_STATE_CONTENT.starterPrompts.length);
  });

  it("is absent from the app welcome", () => {
    vi.stubEnv("VITE_SITE_AGENT_ID", "");
    const { container } = render(<ThreadWelcome />);
    expect(container.querySelector("[data-slot='starter-prompts']")).toBeNull();
  });

  it("renders its children as chips", () => {
    render(
      <StarterPromptSlot>
        <span>chip</span>
      </StarterPromptSlot>,
    );
    expect(screen.getByText("chip").parentElement).toHaveAttribute("data-slot", "starter-prompts");
  });
});

describe("MobileBottomNav (P1-3)", () => {
  it("steps aside, with the layout spacer after it, when the document is flagged chat-active", () => {
    render(
      <MemoryRouter>
        <MobileBottomNav />
      </MemoryRouter>,
    );
    const nav = screen.getByRole("navigation", { name: "Main" });
    expect(nav.className).toContain(`[html[${CHAT_ACTIVE_ATTRIBUTE}]_&]:hidden`);
    expect(nav.className).toContain(`[html[${CHAT_ACTIVE_ATTRIBUTE}]_&+div]:hidden`);
  });
});
