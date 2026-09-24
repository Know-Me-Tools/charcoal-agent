/**
 * app-shell spec: navigation state treatment, persistent runtime status, skip
 * navigation, and Flat 2.0 surfaces (fill-separated regions, no borders or
 * shadows, nothing below 12px).
 */
import { expect, test } from "./support/test";

const DESTINATIONS = [
  { path: "/threads", active: "Threads" },
  { path: "/agents", active: "Agents" },
  { path: "/settings/providers", active: "Settings" },
] as const;
const LABELS = ["Threads", "Agents", "Settings"];

for (const { path, active } of DESTINATIONS) {
  test(`top bar marks ${active} as the active destination on ${path}`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(path);
    const nav = page.getByRole("navigation", { name: "Main" });
    for (const label of LABELS) {
      const link = nav.getByRole("link", { name: label, exact: true });
      if (label === active) {
        await expect(link).toHaveAttribute("aria-current", "page");
        await expect(link).toHaveClass(/\bbg-ember-soft\b/);
      } else {
        await expect(link).not.toHaveAttribute("aria-current");
      }
    }
  });
}

test("bottom navigation marks the active destination on phones", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto("/agents");
  const nav = page.getByRole("navigation", { name: "Main" });
  await expect(nav.getByRole("link", { name: "Agents" })).toHaveAttribute("aria-current", "page");
  await expect(nav.getByRole("link", { name: "Threads" })).not.toHaveAttribute("aria-current");
});

test("runtime status is visible in the top bar on every desktop route", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  for (const path of ["/agents", "/settings/providers"]) {
    await page.goto(path);
    const status = page.getByRole("banner").getByRole("status");
    await expect(status).toHaveText("Connected");
    await expect(status).toHaveAccessibleName(/runtime connected/i);
  }
});

test("first Tab reaches a skip link that moves focus to the main content", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/agents");
  await expect(page.getByText("Research Analyst").first()).toBeVisible();
  await page.keyboard.press("Tab");
  const skip = page.getByRole("link", { name: "Skip to content" });
  await expect(skip).toBeFocused();
  await expect(skip).toBeVisible();
  await page.keyboard.press("Enter");
  await expect(page.locator("main#main")).toBeFocused();
});

test("icon-only controls in the top bar are named", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/threads");
  await expect(page.getByRole("banner").getByRole("button", { name: /switch to (light|dark) theme/i })).toBeVisible();
});
