/**
 * About / Sources panel on the site build (site-shell-about-panel-and-empty-state,
 * task 6.2). Sources come from the open thread's citation blocks; a source
 * links out only under the citation allowlist rule (FR-16), otherwise its
 * destination is shown as text. The About copy comes from
 * `content/site/about-panel.ts` (DRAFT).
 */
import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it } from "vitest";
import { ABOUT_PANEL_CONTENT } from "../../../content/site/about-panel";
import { useChatMessageStore } from "@/stores/chat-message-store";
import { useUiStore } from "@/stores/ui-store";
import type { RichMessage } from "@/types/chat-content";
import { AboutSourcesPanel, AboutSourcesSheet } from "./about-sources-panel";

const THREAD_ID = "22222222-2222-4222-8222-222222222222";

function assistant(id: string, content: RichMessage["content"]): RichMessage {
  return { id, role: "assistant", content, createdAt: new Date(0), status: "complete" };
}

function renderInThread(ui: React.ReactElement) {
  return render(
    <MemoryRouter initialEntries={[`/threads/${THREAD_ID}`]}>
      <Routes>
        <Route path="/threads/:id" element={ui} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  useChatMessageStore.setState({ messagesByThread: {} });
  useUiStore.setState({ aboutPanelOpen: true, contextSheetOpen: false });
});

describe("AboutSourcesPanel", () => {
  it("lists the thread's citations once each, linking only allowlisted destinations", () => {
    useChatMessageStore.setState({
      messagesByThread: {
        [THREAD_ID]: [
          assistant("m1", [
            { type: "text", text: "Answer" },
            { type: "citation", source: "the-boss-0123456789ab.md", content: "snip", url: "https://know-me.tools/the-boss" },
            { type: "citation", source: "faq.md", content: "snip", url: "https://evil.example/faq" },
          ]),
          assistant("m2", [
            { type: "citation", source: "the-boss-0123456789ab.md", content: "again", url: "https://know-me.tools/the-boss" },
          ]),
        ],
        other: [assistant("x", [{ type: "citation", source: "elsewhere.md", content: "", url: undefined }])],
      },
    });

    renderInThread(<AboutSourcesPanel />);
    const sources = screen.getByRole("list", { name: ABOUT_PANEL_CONTENT.sources.heading });
    const items = within(sources).getAllByRole("listitem");
    expect(items).toHaveLength(2);

    const link = within(items[0]).getByRole("link", { name: /The Boss/ });
    expect(link).toHaveAttribute("href", "https://know-me.tools/the-boss");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");

    expect(within(items[1]).queryByRole("link")).toBeNull();
    expect(items[1]).toHaveTextContent("FAQ");
    expect(items[1]).toHaveTextContent("https://evil.example/faq");

    expect(sources).not.toHaveTextContent("Elsewhere");
  });

  // Integration gate 08, S2b: the panel and the in-message Sources block
  // named one source two ways. Both now use `citationDisplayName`.
  it.each([
    ["knowme-platforms-and-status.0123456789ab.md", "KnowMe platforms and status"],
    ["the-boss-overview_3f9a2c1d7e4b.md", "The Boss overview"],
    ["Products/universal agent runtime", "Universal Agent Runtime"],
  ])("names %s exactly as the citation cards do (%s)", (source, expected) => {
    useChatMessageStore.setState({
      messagesByThread: {
        [THREAD_ID]: [assistant("m1", [{ type: "citation", source, content: "snip", url: undefined }])],
      },
    });

    renderInThread(<AboutSourcesPanel />);
    const sources = screen.getByRole("list", { name: ABOUT_PANEL_CONTENT.sources.heading });
    const [item] = within(sources).getAllByRole("listitem");
    expect(within(item).getByText(expected)).toBeInTheDocument();
    expect(item).not.toHaveTextContent(/[0-9a-f]{12}|\/|\.md/);
  });

  it("explains the empty Sources list before any citation arrives", () => {
    renderInThread(<AboutSourcesPanel />);
    expect(screen.getByText(ABOUT_PANEL_CONTENT.sources.empty)).toBeInTheDocument();
  });

  it("shows the About copy, The Boss link, and no agent-picker copy", () => {
    renderInThread(<AboutSourcesPanel />);
    const panel = screen.getByRole("complementary", { name: ABOUT_PANEL_CONTENT.title });
    for (const paragraph of ABOUT_PANEL_CONTENT.about.paragraphs) {
      expect(panel).toHaveTextContent(paragraph);
    }
    expect(within(panel).getByRole("link", { name: /the-boss\.know-me\.tools/ })).toHaveAttribute(
      "href",
      ABOUT_PANEL_CONTENT.about.theBoss.href,
    );
    expect(panel.textContent).not.toMatch(/choose an agent|system prompt|active agent/i);
  });

  it("renders nothing while closed", () => {
    useUiStore.setState({ aboutPanelOpen: false });
    renderInThread(<AboutSourcesPanel />);
    expect(screen.queryByRole("complementary")).toBeNull();
  });

  it("closes from its labelled close button", async () => {
    renderInThread(<AboutSourcesPanel />);
    await userEvent.click(screen.getByRole("button", { name: ABOUT_PANEL_CONTENT.closeLabel }));
    expect(useUiStore.getState().aboutPanelOpen).toBe(false);
  });
});

describe("AboutSourcesSheet", () => {
  it("opens as a labelled dialog with focus inside, and Escape closes it", async () => {
    renderInThread(<AboutSourcesSheet />);
    act(() => useUiStore.setState({ contextSheetOpen: true }));

    const dialog = await screen.findByRole("dialog", { name: ABOUT_PANEL_CONTENT.title });
    expect(dialog).toContainElement(document.activeElement as HTMLElement);
    expect(within(dialog).getByRole("button", { name: ABOUT_PANEL_CONTENT.closeLabel })).toBeInTheDocument();

    await userEvent.keyboard("{Escape}");
    expect(useUiStore.getState().contextSheetOpen).toBe(false);
  });
});
