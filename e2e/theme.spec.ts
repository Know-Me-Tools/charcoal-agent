/**
 * brand-theme spec: theme persistence (no flash), dark default, font size.
 */
import { expect, test } from "./support/test";

const canvas = (page: import("@playwright/test").Page) =>
  page.evaluate(() => getComputedStyle(document.body).backgroundColor);

test("first visit uses the dark theme", async ({ page }) => {
  await page.goto("/settings/appearance");
  await expect(page.locator("html")).toHaveClass(/\bdark\b/);
  await expect.poll(() => canvas(page)).toBe("rgb(11, 15, 20)");
});

test("light theme persists across reload and applies before first paint", async ({ page }) => {
  await page.goto("/settings/appearance");
  await page.getByRole("button", { name: "Light", exact: true }).click();
  await expect(page.locator("html")).not.toHaveClass(/\bdark\b/);
  await expect.poll(() => canvas(page)).toBe("rgb(247, 247, 248)");

  // Record the <html> class as soon as the document exists, before app scripts run.
  await page.addInitScript(() => {
    document.addEventListener("readystatechange", () => {
      if (document.readyState === "interactive") {
        (window as unknown as { __firstClass: string }).__firstClass =
          document.documentElement.className;
      }
    });
  });
  await page.reload();
  await expect(page.locator("html")).not.toHaveClass(/\bdark\b/);
  const firstClass = await page.evaluate(
    () => (window as unknown as { __firstClass?: string }).__firstClass ?? "",
  );
  expect(firstClass).not.toMatch(/\bdark\b/);
  await expect.poll(() => canvas(page)).toBe("rgb(247, 247, 248)");
});

test("comfortable font size scales the interface and persists", async ({ page }) => {
  await page.goto("/settings/appearance");
  await expect(page.getByRole("button", { name: "Comfortable" })).toBeVisible();
  const base = await page.evaluate(() => parseFloat(getComputedStyle(document.documentElement).fontSize));
  await page.getByRole("button", { name: "Comfortable" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-font-size", "comfortable");
  const larger = await page.evaluate(() => parseFloat(getComputedStyle(document.documentElement).fontSize));
  expect(larger).toBeGreaterThan(base);

  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-font-size", "comfortable");
});
