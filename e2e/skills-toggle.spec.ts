/**
 * Runtime data sync through the entity graph: a skill toggle shows at once
 * (optimistic) and reverts when the runtime rejects it.
 */
import type { Page } from "@playwright/test";
import { expect, test } from "./support/test";

/**
 * The toggle is `role="switch" aria-checked={enabled}`, named
 * `"${skill.name}: enabled" | "${skill.name}: disabled"` (skills-page.tsx,
 * app-pages spec "Skill toggles expose their state" — brand-fidelity-audit
 * task 1.1). This helper used to match the pre-fix `aria-label="Enable
 * skill"/"Disable skill"` markup, which no longer exists, so every test
 * below failed with a locator timeout; not a runtime-sync regression.
 */
function skillToggle(page: Page, title: string) {
  return page.getByRole("switch", { name: new RegExp(`^${title}: (enabled|disabled)$`) });
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
  await expect(toggle).toHaveAttribute("aria-checked", "false");

  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-checked", "true");
  release();
  await expect(toggle).toHaveAttribute("aria-checked", "true");
});

test("a rejected toggle reverts to the previous state", async ({ page }) => {
  await page.route("**/api/skills/code-runner/toggle", (route) =>
    route.fulfill({ status: 500, contentType: "application/json", body: '{"error":"locked"}' }),
  );

  await page.goto("/settings/skills");
  const toggle = skillToggle(page, "Code Runner");
  await expect(toggle).toHaveAttribute("aria-checked", "false");

  const rejected = page.waitForResponse("**/api/skills/code-runner/toggle");
  await toggle.click();
  expect((await rejected).status()).toBe(500);
  await expect(toggle).toHaveAttribute("aria-checked", "false");
});
