import { expect, test } from "./support/test";

test("providers page renders fixture data with no live UAR", async ({ page }) => {
  await page.goto("/settings/providers");
  await expect(page.getByText("OpenAI").first()).toBeVisible();
  await expect(page.getByText("Anthropic").first()).toBeVisible();
});

test("agents page renders fixture agents", async ({ page }) => {
  await page.goto("/agents");
  await expect(page.getByText("Research Analyst").first()).toBeVisible();
  await expect(page.getByText("Calendar Concierge").first()).toBeVisible();
});
