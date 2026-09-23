/**
 * Every application route the harness captures, with a locator that proves the
 * page has rendered real (fixture) content rather than a loading skeleton.
 */
import { expect, type Page } from "@playwright/test";
import { FIXTURE_AGENT_ID } from "../fixtures/uar-data";
import { FIXTURE_FINAL_TEXT } from "../fixtures/sse";

export interface AppRoute {
  /** Stable name used in screenshot filenames and test titles. */
  name: string;
  path: string;
  /** Text that must be visible before capture. */
  readyText: string | RegExp;
  /** Optional interaction that builds page state (e.g. a streamed conversation). */
  prepare?: (page: Page) => Promise<void>;
}

/** Fixed thread id so screenshots are stable; each test has a fresh IndexedDB. */
export const FIXTURE_THREAD_ID = "0b6c3a8e-7d2f-4c1a-9e5b-3f8d2a1c4e70";

/** Send a message through the real composer and wait for the scripted stream to finish. */
async function streamFixtureConversation(page: Page): Promise<void> {
  const composer = page.getByPlaceholder(/Ask your agent anything/i).filter({ visible: true });
  await composer.fill("Plan my week around the rebrand launch.");
  await composer.press("Enter");
  await expect(page.getByText(FIXTURE_FINAL_TEXT).filter({ visible: true }).first()).toBeVisible();
  await expandToScrollableContent(page);
}

/**
 * The thread scrolls inside its own container, so a full-page capture would
 * only show the viewport. Grow the viewport by the largest inner overflow so
 * every block in the conversation is captured.
 */
async function expandToScrollableContent(page: Page): Promise<void> {
  const overflow = await page.evaluate(() => {
    let extra = 0;
    for (const el of Array.from(document.querySelectorAll<HTMLElement>("*"))) {
      const style = getComputedStyle(el);
      if (!/(auto|scroll)/.test(style.overflowY)) continue;
      extra = Math.max(extra, el.scrollHeight - el.clientHeight);
    }
    return extra;
  });
  const size = page.viewportSize();
  if (size && overflow > 0) {
    await page.setViewportSize({ width: size.width, height: size.height + overflow });
  }
}

export const APP_ROUTES: AppRoute[] = [
  { name: "landing", path: "/", readyText: /AI that/i },
  { name: "threads", path: "/threads", readyText: /threads/i },
  {
    name: "thread",
    path: `/threads/${FIXTURE_THREAD_ID}`,
    readyText: /Ask anything|KnowMe/i,
    prepare: streamFixtureConversation,
  },
  { name: "agents", path: "/agents", readyText: "Research Analyst" },
  { name: "agent-new", path: "/agents/new", readyText: /agent/i },
  { name: "agent-detail", path: `/agents/${FIXTURE_AGENT_ID}`, readyText: "KnowMe" },
  { name: "settings-providers", path: "/settings/providers", readyText: "Anthropic" },
  { name: "settings-skills", path: "/settings/skills", readyText: "Web Search" },
  { name: "settings-appearance", path: "/settings/appearance", readyText: /appearance/i },
  { name: "settings-about", path: "/settings/about", readyText: /about/i },
  { name: "settings-account", path: "/settings/account", readyText: /caching|settings/i },
  { name: "not-found", path: "/does-not-exist", readyText: /404|not found/i },
];

export const VIEWPORT_WIDTHS = [320, 768, 1024, 1440] as const;
export const VIEWPORT_HEIGHT = 900;
export const THEMES = ["dark", "light"] as const;
export type Theme = (typeof THEMES)[number];
