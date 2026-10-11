/**
 * R7 task 1.1: a real visitor turn on the compose stack. The agent answers,
 * the card renders as components, diagnostics stay hidden, and a stopped run
 * shows its state. The model decides whether to call the card tool, so the
 * card assertions are the thing under test, not a given.
 */
import { expect, test, type Page } from "@playwright/test";
import { randomUUID } from "node:crypto";

const DIAGNOSTICS = [
  "effective_run_policy",
  "turn_manifest",
  "attempt_manifest",
  "provider_event",
  "presentation_render",
  "tool_call",
];

async function ask(page: Page, text: string): Promise<void> {
  await page.goto(`/threads/${randomUUID()}`);
  const composer = page.getByPlaceholder(/Ask your agent anything/i).filter({ visible: true });
  await composer.fill(text);
  await composer.press("Enter");
}

test("a factual question renders an A2UI card as components and hides diagnostics", async ({
  page,
}) => {
  await ask(page, "What is The Boss?");

  const surface = page.getByTestId("a2ui-surface");
  await expect(surface).toBeVisible();
  await expect(page.getByTestId("a2ui-surface-error")).toHaveCount(0);

  // Components, not code: the card has a heading and body text, and the
  // surface holds no raw JSON or protocol words.
  await expect(surface.getByRole("heading")).toHaveCount(1);
  const cardText = (await surface.innerText()).trim();
  expect(cardText.length).toBeGreaterThan(20);
  expect(cardText).not.toMatch(/updateComponents|createSurface|"component"/);

  // No interactive control inside the card.
  await expect(surface.locator("button, input, select, textarea, a[href]")).toHaveCount(0);

  const body = await page.locator("body").innerText();
  for (const word of DIAGNOSTICS) {
    expect(body, `${word} reached the visitor`).not.toContain(word);
  }
  // Frame the finished card, not the middle of the stream.
  await expect(page.getByRole("button", { name: "Stop generating" })).toHaveCount(0);
  await surface.evaluate((el) => el.scrollIntoView({ block: "center" }));
  await page.screenshot({ path: "test-results/live-card.png" });
});

test("stopping a run mid-stream leaves the thread usable and shows no diagnostics", async ({
  page,
}) => {
  await ask(page, "Explain in detail what The Boss is and how it works.");
  const stop = page.getByRole("button", { name: "Stop generating" }).first();
  await expect(stop).toBeVisible();
  await stop.click();

  // The run ends: the stop control goes away and the composer takes input again.
  await expect(stop).toBeHidden();
  const composer = page.getByPlaceholder(/Ask your agent anything/i).filter({ visible: true });
  await expect(composer).toBeEditable();

  const body = await page.locator("body").innerText();
  for (const word of DIAGNOSTICS) {
    expect(body, `${word} reached the visitor`).not.toContain(word);
  }
  await expect(page.getByRole("status").filter({ hasText: "Run cancelled" })).toBeVisible();
  await page.screenshot({ path: "test-results/live-cancelled.png", fullPage: true });
});
