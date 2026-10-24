/**
 * site-concierge-opening: a visitor who opens the chat directly sees the
 * portfolio-wide opening and its starter prompts; pressing one sends the
 * question as the first user message of that same thread. Site build only
 * (VITE_SITE_AGENT_ID=knowme-site). Only the UAR backend is the suite's mock.
 */
import { randomUUID } from "node:crypto";
import { expect, test } from "./support/test";
import { FIXTURE_FINAL_TEXT } from "./fixtures/sse";
import { EMPTY_STATE_CONTENT } from "../content/site/empty-state";

test.skip(!process.env.VITE_SITE_AGENT_ID, "site build only: run with VITE_SITE_AGENT_ID=knowme-site");

test("the empty chat shows the portfolio opening and its chips", async ({ page }) => {
  await page.goto(`/threads/${randomUUID()}`);
  await expect(page.getByText(EMPTY_STATE_CONTENT.description)).toBeVisible();
  for (const prompt of EMPTY_STATE_CONTENT.starterPrompts) {
    await expect(page.getByRole("button", { name: prompt, exact: true })).toBeVisible();
  }
});

test("a chip press sends its question as the first user message", async ({ page }) => {
  const prompt = EMPTY_STATE_CONTENT.starterPrompts[1];
  await page.goto(`/threads/${randomUUID()}`);
  await page.waitForLoadState("networkidle");
  await page.getByRole("button", { name: prompt, exact: true }).click();

  await expect(page.getByText(prompt, { exact: true }).first()).toBeVisible();
  await expect(page.getByText(FIXTURE_FINAL_TEXT).first()).toBeVisible();
  const text = await page.locator("main").innerText();
  expect(text.indexOf(prompt)).toBeGreaterThanOrEqual(0);
  expect(text.indexOf(prompt)).toBeLessThan(text.indexOf(FIXTURE_FINAL_TEXT));
});
