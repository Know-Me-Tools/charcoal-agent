/**
 * Runtime data sync through the entity graph: a skill toggle shows at once
 * (optimistic) and reverts when the runtime rejects it.
 */
import type { Page } from "@playwright/test";
import { expect, test } from "./support/test";

function skillToggle(page: Page, title: string) {
  const row = page
    .locator("div")
    .filter({ has: page.getByText(title, { exact: true }) })
    .filter({ has: page.getByRole("button", { name: /(En|Dis)able skill/ }) })
    .last();
  return row.getByRole("button", { name: /(En|Dis)able skill/ });
}

test("enabling a skill updates the page before the runtime answers", async ({ page }) => {
  let release!: () => void;
  const answered = new Promise<void>((r) => (release = r));
  await page.route("**/api/skills/code-runner/toggle", async (route) => {
    await answered;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ skill_id: "code-runner", title: "Code Runner", enabled: true }),
    });
  });

  await page.goto("/settings/skills");
  const toggle = skillToggle(page, "Code Runner");
  await expect(toggle).toHaveAttribute("aria-label", "Enable skill");

  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-label", "Disable skill");
  release();
  await expect(toggle).toHaveAttribute("aria-label", "Disable skill");
});

test("a rejected toggle reverts to the previous state", async ({ page }) => {
  await page.route("**/api/skills/code-runner/toggle", (route) =>
    route.fulfill({ status: 500, contentType: "application/json", body: '{"error":"locked"}' }),
  );

  await page.goto("/settings/skills");
  const toggle = skillToggle(page, "Code Runner");
  await expect(toggle).toHaveAttribute("aria-label", "Enable skill");

  const rejected = page.waitForResponse("**/api/skills/code-runner/toggle");
  await toggle.click();
  expect((await rejected).status()).toBe(500);
  await expect(toggle).toHaveAttribute("aria-label", "Enable skill");
});
