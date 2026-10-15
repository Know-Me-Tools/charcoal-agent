/**
 * The site front page links to this browser's saved conversations only when
 * the real PGlite database holds one. Run with the site build flags
 * (VITE_SITE_AGENT_ID=knowme-site): the app build has its own "Open app" link.
 */
import { expect, test } from "./support/test";
import { FIXTURE_THREAD_ID } from "./support/routes";
import { FIXTURE_FINAL_TEXT } from "./fixtures/sse";

const LINK = "Your conversations";

test("front page shows the history link only after a conversation is saved", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByRole("link", { name: LINK })).toHaveCount(0);

  await page.goto(`/threads/${FIXTURE_THREAD_ID}`);
  const composer = page.getByLabel("Message input").filter({ visible: true });
  await expect(composer).toBeVisible();
  await page.waitForLoadState("networkidle");
  await composer.fill("What does KnowMe do for small teams?");
  await composer.press("Enter");
  await expect(page.getByText(FIXTURE_FINAL_TEXT).first()).toBeVisible();
  await page.waitForLoadState("networkidle");

  await page.goto("/");
  const link = page.getByRole("link", { name: LINK });
  await expect(link).toBeVisible();
  await link.click();
  await expect(page).toHaveURL(/\/threads$/);
});

for (const width of [320, 1440]) {
  test(`header with the history link at ${width}px has no overflow`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 800 });
    await page.goto(`/threads/${FIXTURE_THREAD_ID}`);
    const composer = page.getByLabel("Message input").filter({ visible: true });
    await expect(composer).toBeVisible();
    await page.waitForLoadState("networkidle");
    await composer.fill("What does KnowMe do for small teams?");
    await composer.press("Enter");
    await expect(page.getByText(FIXTURE_FINAL_TEXT).first()).toBeVisible();
    await page.waitForLoadState("networkidle");
    await page.goto("/");
    await expect(page.getByRole("link", { name: LINK })).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
    await page.screenshot({ path: testInfo.outputPath(`history-link-${width}.png`), clip: { x: 0, y: 0, width, height: 120 } });
    await testInfo.attach(`history-link-${width}`, { path: testInfo.outputPath(`history-link-${width}.png`), contentType: "image/png" });
  });
}
