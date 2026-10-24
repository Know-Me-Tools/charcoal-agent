/**
 * site-home-directory: a directory chip on the front page opens a thread whose
 * first user message is that entry's question. Run with the site build flags
 * (VITE_SITE_AGENT_ID=knowme-site), as the other site specs do.
 * Everything after the click is the real app (intent store, thread route,
 * chat runtime, PGlite); only the UAR backend is the suite's mock.
 */
import { expect, test } from "./support/test";
import { FIXTURE_FINAL_TEXT } from "./fixtures/sse";
import { DIRECTORY } from "../content/site/directory";

test.skip(!process.env.VITE_SITE_AGENT_ID, "The directory exists only on the site build (set VITE_SITE_AGENT_ID).");

const TILE = DIRECTORY.families[0].leads[0];
const ROW = DIRECTORY.families[0].rest[0];

test("a directory chip opens a thread whose first message is the entry's question", async ({ page }) => {
  await page.goto("/");
  const chip = page.getByRole("button", { name: TILE.question });
  await expect(chip).toBeVisible();
  await page.waitForLoadState("networkidle");

  await chip.click();

  await expect(page).toHaveURL(/\/threads\/[0-9a-f-]{36}$/);
  await expect(page.getByText(TILE.question, { exact: true }).first()).toBeVisible();
  await expect(page.getByText(FIXTURE_FINAL_TEXT).first()).toBeVisible();
  const text = await page.locator("main").innerText();
  expect(text.indexOf(TILE.question)).toBeGreaterThanOrEqual(0);
  expect(text.indexOf(TILE.question)).toBeLessThan(text.indexOf(FIXTURE_FINAL_TEXT));

  // An index row's short "Ask" chip sends its own full question the same way.
  await page.goto("/");
  const rowChip = page.getByRole("button", { name: `Ask the concierge: ${ROW.prompt}` });
  await expect(rowChip).toBeVisible();
  await page.waitForLoadState("networkidle");
  await rowChip.click();
  await expect(page).toHaveURL(/\/threads\/[0-9a-f-]{36}$/);
  await expect(page.getByText(ROW.prompt, { exact: true }).first()).toBeVisible();
  await expect(page.getByText(FIXTURE_FINAL_TEXT).first()).toBeVisible();
});
