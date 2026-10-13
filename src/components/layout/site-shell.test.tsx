/**
 * Site-build shell gating (site-shell-about-panel-and-empty-state, tasks 6.1
 * and 6.2).
 *
 * 6.1: the runtime status pill is infra detail. On the site build its empty
 * base URL rendered the word "localhost" to visitors, so neither mount (top
 * bar, sidebar footer) renders it there. The app build keeps both.
 *
 * 6.2: the site build mounts the About / Sources panel instead of the agent
 * Context panel, closed by default, with the top-bar toggle labelled
 * "About and sources". The app build keeps the Context panel unchanged.
 */
import { act, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ABOUT_PANEL_CONTENT } from "../../../content/site/about-panel";
import { useUiStore } from "@/stores/ui-store";

const viewport = vi.hoisted(() => ({ wide: true, mobile: false }));
vi.mock("@/hooks/use-media-query", () => ({
  useMediaQuery: (query: string) => (query.includes("max-width") ? viewport.mobile : viewport.wide),
}));
vi.mock("@/hooks/use-health", () => ({ useHealth: () => ({ isLoading: false, data: { status: "ok" } }) }));
vi.mock("@/hooks/use-agents", () => ({ useAgents: () => ({ data: [] }) }));
vi.mock("@/hooks/use-db-hydration", () => ({ useDbHydration: () => undefined }));

import { Topbar } from "./topbar";
import { LeftSidebar } from "./left-sidebar";
import { AppLayout } from "./app-layout";

const SITE_AGENT = "knowme-site";
const THREAD_PATH = "/threads/11111111-1111-4111-8111-111111111111";

function renderAt(ui: React.ReactElement, path = THREAD_PATH) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/threads/:id" element={ui} />
        <Route path="/" element={ui} />
      </Routes>
    </MemoryRouter>,
  );
}

function renderLayout() {
  return render(
    <MemoryRouter initialEntries={[THREAD_PATH]}>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/threads/:id" element={<p>thread body</p>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  viewport.wide = true;
  viewport.mobile = false;
  useUiStore.setState({ rightPanelOpen: true, aboutPanelOpen: false, contextSheetOpen: false });
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("6.1 runtime status on the site build", () => {
  it("the top bar shows no runtime status and no 'localhost' on the site build", () => {
    vi.stubEnv("VITE_SITE_AGENT_ID", SITE_AGENT);
    renderAt(<Topbar />);
    expect(screen.queryByRole("status")).toBeNull();
    expect(document.body.innerHTML).not.toMatch(/localhost/i);
  });

  it("the sidebar footer shows no runtime status and no 'localhost' on the site build", () => {
    vi.stubEnv("VITE_SITE_AGENT_ID", SITE_AGENT);
    renderAt(<LeftSidebar />);
    expect(screen.queryByRole("status")).toBeNull();
    expect(document.body.innerHTML).not.toMatch(/localhost/i);
  });

  it("the app build keeps the runtime status in the top bar", () => {
    vi.stubEnv("VITE_SITE_AGENT_ID", "");
    renderAt(<Topbar />);
    expect(screen.getByRole("status")).toHaveAccessibleName(/runtime connected/i);
  });

  it("the app build keeps the runtime status in the sidebar footer", () => {
    vi.stubEnv("VITE_SITE_AGENT_ID", "");
    renderAt(<LeftSidebar />);
    expect(screen.getByRole("status")).toHaveAccessibleName(/runtime connected/i);
  });
});

describe("6.2 panel toggle label", () => {
  it("is 'About and sources' on the site build", () => {
    vi.stubEnv("VITE_SITE_AGENT_ID", SITE_AGENT);
    renderAt(<Topbar />);
    const toggle = screen.getByRole("button", { name: ABOUT_PANEL_CONTENT.title });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("button", { name: /context panel/i })).toBeNull();
  });

  it("stays 'Toggle context panel' on the app build", () => {
    vi.stubEnv("VITE_SITE_AGENT_ID", "");
    renderAt(<Topbar />);
    expect(screen.getByRole("button", { name: "Toggle context panel" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: ABOUT_PANEL_CONTENT.title })).toBeNull();
  });
});

describe("6.2 panel mounting", () => {
  it("the site build mounts About / Sources, closed by default, never the Context panel", () => {
    vi.stubEnv("VITE_SITE_AGENT_ID", SITE_AGENT);
    renderLayout();
    // Closed by default even though the app's rightPanelOpen default is true.
    expect(screen.queryByRole("complementary", { name: ABOUT_PANEL_CONTENT.title })).toBeNull();
    expect(screen.queryByRole("complementary", { name: "Context" })).toBeNull();

    act(() => {
      screen.getByRole("button", { name: ABOUT_PANEL_CONTENT.title }).click();
    });

    const panel = screen.getByRole("complementary", { name: ABOUT_PANEL_CONTENT.title });
    expect(panel).toHaveTextContent(ABOUT_PANEL_CONTENT.about.heading);
    expect(screen.queryByRole("complementary", { name: "Context" })).toBeNull();
    expect(document.body.textContent).not.toMatch(/choose an agent/i);
  });

  it("the app build keeps the Context panel", () => {
    vi.stubEnv("VITE_SITE_AGENT_ID", "");
    renderLayout();
    const panel = screen.getByRole("complementary", { name: "Context" });
    expect(panel).toHaveTextContent(/choose an agent/i);
    expect(screen.queryByRole("complementary", { name: ABOUT_PANEL_CONTENT.title })).toBeNull();
  });

  it("below the wide breakpoint the site toggle opens the About / Sources sheet", async () => {
    vi.stubEnv("VITE_SITE_AGENT_ID", SITE_AGENT);
    viewport.wide = false;
    renderLayout();
    act(() => {
      screen.getByRole("button", { name: ABOUT_PANEL_CONTENT.title }).click();
    });
    const dialog = await screen.findByRole("dialog", { name: ABOUT_PANEL_CONTENT.title });
    expect(dialog).toHaveTextContent(ABOUT_PANEL_CONTENT.sources.heading);
    expect(document.body.textContent).not.toMatch(/choose an agent/i);
  });
});
