/**
 * site-ask-concierge: pressing a prompt chip opens a new thread whose first
 * user message is the chip's prompt. The chip sits on a harness page
 * (e2e/harness/ask-chip.tsx) because no site page mounts one yet; everything
 * after the click is the real app: intent store, thread route, chat runtime,
 * PGlite. Only the UAR backend is the suite's mock.
 */
import { expect, test } from "./support/test";
import { FIXTURE_FINAL_TEXT } from "./fixtures/sse";

const PROMPT = "What is The Boss, and how far along is it?";

test("a chip press opens a new thread with its prompt as the first user message", async ({ page }) => {
  await page.goto("/e2e/harness/ask-chip.html");
  const chip = page.getByRole("button", { name: PROMPT });
  await expect(chip).toBeVisible();
  await page.waitForLoadState("networkidle");

  await chip.click();

  await expect(page).toHaveURL(/\/threads\/[0-9a-f-]{36}$/);
  // The visitor's question is the first message, then the streamed answer.
  const userMessage = page.getByText(PROMPT, { exact: true }).first();
  await expect(userMessage).toBeVisible();
  await expect(page.getByText(FIXTURE_FINAL_TEXT).first()).toBeVisible();
  const text = await page.locator("main").innerText();
  expect(text.indexOf(PROMPT)).toBeGreaterThanOrEqual(0);
  expect(text.indexOf(PROMPT)).toBeLessThan(text.indexOf(FIXTURE_FINAL_TEXT));
});
