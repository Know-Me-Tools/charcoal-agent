/**
 * app-home-resume-chat: on the site build's front page, a button takes a
 * returning visitor straight to their most recent saved conversation. Run with
 * the site build flags (VITE_SITE_AGENT_ID=knowme-site): the app build has its
 * own "Open app" link and no such button. The conversation is saved through the
 * real app into the real PGlite database; only the UAR backend is the mock.
 */
import type { Page } from "@playwright/test";
import { expect, test } from "./support/test";
import { seedTheme } from "./support/page-helpers";
import { FIXTURE_FINAL_TEXT } from "./fixtures/sse";
import { RESUME_CHAT_CONTENT } from "../content/site/resume-chat";
import { SITE_LANDING_CONTENT } from "../content/site/landing-site";

const QUESTION = "What does KnowMe do for small teams?";
const HISTORY_LABEL = "Your conversations";
const MIN_TARGET = 44;
const CLS_LIMIT = 0.1;

interface Shift {
  value: number;
  nodes: string[];
}

/**
 * Save a conversation the way a visitor does: ask the first question in the
 * front-page composer. Returns the new conversation's id, read from its URL.
 */
async function createSavedThread(page: Page): Promise<string> {
  await page.goto("/");
  const composer = page.getByRole("textbox", { name: SITE_LANDING_CONTENT.composer.placeholder });
  await expect(composer).toBeVisible();
  await page.waitForLoadState("networkidle");
  await composer.fill(QUESTION);
  await composer.press("Enter");
  await expect(page.getByText(FIXTURE_FINAL_TEXT).first()).toBeVisible();
  // Reload once so the conversation is known to be stored, not only on screen:
  // after a reload the messages can only come from the database.
  await page.reload();
  await expect(page.getByText(FIXTURE_FINAL_TEXT).first()).toBeVisible();
  await page.waitForLoadState("networkidle");
  const match = /\/threads\/([^/?#]+)/.exec(new URL(page.url()).pathname);
  expect(match, `conversation URL ${page.url()}`).not.toBeNull();
  return match![1];
}

/** Record every layout-shift entry (value and the nodes that moved) from the first paint on. */
async function trackLayoutShift(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const w = window as unknown as { __shifts: Shift[] };
    w.__shifts = [];
    new PerformanceObserver((list) => {
      for (const e of list.getEntries() as unknown as {
        value: number;
        hadRecentInput: boolean;
        sources?: { node?: Element }[];
      }[]) {
        if (e.hadRecentInput) continue;
        const nodes = (e.sources ?? []).map((s) => {
          const n = s.node;
          return n ? `${n.tagName.toLowerCase()}${n.id ? `#${n.id}` : ""}.${String(n.className).slice(0, 40)}` : "(gone)";
        });
        w.__shifts.push({ value: e.value, nodes });
      }
    }).observe({ type: "layout-shift", buffered: true });
  });
}

test("no saved conversation, no button", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await page.waitForLoadState("networkidle");
  // Give the stored-chats read time to finish: the button must still be absent after it.
  await page.waitForTimeout(1500);
  await expect(page.getByRole("link", { name: RESUME_CHAT_CONTENT.label })).toHaveCount(0);
  await expect(page.getByRole("link", { name: HISTORY_LABEL })).toHaveCount(0);
});

test("a saved conversation: the button appears, is a real link, and opens it with its messages", async ({ page }) => {
  const threadId = await createSavedThread(page);
  await page.goto("/");
  const button = page.getByRole("link", { name: RESUME_CHAT_CONTENT.label });
  await expect(button).toBeVisible();
  await expect(button).toHaveAttribute("href", `/threads/${threadId}`);
  // The header link to the list is still there.
  await expect(page.getByRole("link", { name: HISTORY_LABEL })).toBeVisible();

  await button.click();
  await expect(page).toHaveURL(new RegExp(`/threads/${threadId}$`));
  await expect(page.getByText(QUESTION).first()).toBeVisible();
  await expect(page.getByText(FIXTURE_FINAL_TEXT).first()).toBeVisible();
});

test("keyboard: the button takes focus with a visible cue and Enter opens the conversation", async ({ page }) => {
  const threadId = await createSavedThread(page);
  await page.goto("/");
  const button = page.getByRole("link", { name: RESUME_CHAT_CONTENT.label });
  await expect(button).toBeVisible();
  await button.focus();
  await expect(button).toBeFocused();
  const outline = await button.evaluate((el) => getComputedStyle(el).outlineStyle);
  expect(outline, "focus-cue paints an outline").not.toBe("none");
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(new RegExp(`/threads/${threadId}$`));
});

const VARIANTS = [
  { name: "desktop-1440-light", theme: "light", width: 1440, height: 900 },
  { name: "desktop-1440-dark", theme: "dark", width: 1440, height: 900 },
  { name: "phone-320-light", theme: "light", width: 320, height: 640 },
  { name: "phone-320-dark", theme: "dark", width: 320, height: 640 },
] as const;

for (const variant of VARIANTS) {
  test(`the button is a 44 px target, causes no layout shift of ${CLS_LIMIT} or more and does not overflow (${variant.name})`, async ({ page }, testInfo) => {
    await seedTheme(page, variant.theme);
    await createSavedThread(page);
    await page.setViewportSize({ width: variant.width, height: variant.height });
    await trackLayoutShift(page);
    await page.goto("/");

    const button = page.getByRole("link", { name: RESUME_CHAT_CONTENT.label });
    await expect(button).toBeVisible();
    await page.waitForLoadState("networkidle");
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(500);

    const box = await button.boundingBox();
    expect(box, "button has a box").not.toBeNull();
    expect(box!.width, `width at ${variant.width}px (${box!.width}x${box!.height})`).toBeGreaterThanOrEqual(MIN_TARGET);
    expect(box!.height, `height at ${variant.width}px (${box!.width}x${box!.height})`).toBeGreaterThanOrEqual(MIN_TARGET);
    const centreIsControl = await button.evaluate((el) => {
      const r = el.getBoundingClientRect();
      const hit = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
      return hit !== null && (hit === el || el.contains(hit));
    });
    expect(centreIsControl, "nothing covers the button's centre").toBe(true);

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, "no horizontal overflow").toBeLessThanOrEqual(0);

    const shifts = await page.evaluate(() => (window as unknown as { __shifts: Shift[] }).__shifts);
    const total = shifts.reduce((sum, s) => sum + s.value, 0);
    await testInfo.attach(`layout-shift-${variant.name}`, {
      body: JSON.stringify({ total, shifts }, null, 2),
      contentType: "application/json",
    });
    console.log(`CLS ${variant.name}: ${total.toFixed(4)} from ${shifts.length} entries ${JSON.stringify(shifts)}`);
    expect(total, `layout shift on the front page at ${variant.width}px`).toBeLessThan(CLS_LIMIT);

    await page.screenshot({ path: testInfo.outputPath(`resume-chat-${variant.name}.png`) });
    await page.screenshot({ path: testInfo.outputPath(`resume-chat-${variant.name}-full.png`), fullPage: true });
  });
}
