/**
 * The composer's "Search the web" toggle (site build only, off by default).
 * Strings come from `content/site/web-search.ts` (DRAFT, OD-7).
 */
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { WEB_SEARCH_CONTENT } from "../../../content/site/web-search";
import { useWebSearchPreferenceStore } from "@/stores/web-search-preference-store";
import { WebSearchToggle } from "./web-search-toggle";

beforeEach(() => {
  localStorage.clear();
  useWebSearchPreferenceStore.setState({ enabled: false });
  vi.stubEnv("VITE_SITE_AGENT_ID", "knowme-site");
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("WebSearchToggle", () => {
  it("is a pressed/unpressed toggle button named for the feature, off by default", () => {
    render(<WebSearchToggle />);
    const button = screen.getByRole("button", { name: new RegExp(WEB_SEARCH_CONTENT.toggleLabel) });
    expect(button).toHaveAttribute("aria-pressed", "false");
    expect(button).toHaveTextContent(WEB_SEARCH_CONTENT.toggleLabel);
  });

  it("describes the privacy effect: the question goes to a third-party search service", () => {
    render(<WebSearchToggle />);
    const button = screen.getByRole("button", { name: new RegExp(WEB_SEARCH_CONTENT.toggleLabel) });
    const description = document.getElementById(button.getAttribute("aria-describedby") ?? "");
    expect(description).toHaveTextContent(/third-party search service/i);
    expect(description).toHaveTextContent(WEB_SEARCH_CONTENT.tooltip);
  });

  it("turns on with a click, shows a visible on state, and stores the choice", async () => {
    const user = userEvent.setup();
    render(<WebSearchToggle />);
    const button = screen.getByRole("button", { name: new RegExp(WEB_SEARCH_CONTENT.toggleLabel) });
    await user.click(button);
    expect(button).toHaveAttribute("aria-pressed", "true");
    expect(button).toHaveAttribute("data-state", "on");
    expect(useWebSearchPreferenceStore.getState().enabled).toBe(true);
    expect(localStorage.getItem("knowme-site-web-search")).toBe("1");
  });

  it("is keyboard operable with Space and Enter", async () => {
    const user = userEvent.setup();
    render(<WebSearchToggle />);
    const button = screen.getByRole("button", { name: new RegExp(WEB_SEARCH_CONTENT.toggleLabel) });
    await user.tab();
    expect(button).toHaveFocus();
    await user.keyboard(" ");
    expect(button).toHaveAttribute("aria-pressed", "true");
    await user.keyboard("{Enter}");
    expect(button).toHaveAttribute("aria-pressed", "false");
  });

  it("keeps a 44px target below 768 and does not change size between states", async () => {
    const user = userEvent.setup();
    render(<WebSearchToggle />);
    const button = screen.getByRole("button", { name: new RegExp(WEB_SEARCH_CONTENT.toggleLabel) });
    expect(button.className).toContain("max-md:min-h-11");
    // Everything except the colour classes (fill and text colour) is identical in both states.
    const layout = () => button.className.split(/\s+/).filter((c) => !/^(hover:)?(bg|text)-/.test(c)).join(" ");
    const before = layout();
    await user.click(button);
    expect(layout()).toBe(before);
  });

  it("uses no motion that ignores reduced motion", () => {
    render(<WebSearchToggle />);
    const button = screen.getByRole("button", { name: new RegExp(WEB_SEARCH_CONTENT.toggleLabel) });
    expect(button.className).not.toMatch(/\banimate-/);
  });

  it("starts on when the visitor left it on", () => {
    useWebSearchPreferenceStore.setState({ enabled: true });
    render(<WebSearchToggle />);
    expect(screen.getByRole("button", { name: new RegExp(WEB_SEARCH_CONTENT.toggleLabel) })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("renders nothing on the app build", () => {
    vi.unstubAllEnvs();
    const { container } = render(<WebSearchToggle />);
    expect(container).toBeEmptyDOMElement();
  });
});
