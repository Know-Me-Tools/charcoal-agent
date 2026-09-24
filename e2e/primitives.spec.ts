/**
 * ui-primitives spec behaviors that need a real browser: focus trapping,
 * Select keyboard navigation, and the migrated primitives on real pages.
 */
import { expect, test } from "./support/test";
import { APP_ROUTES } from "./support/routes";

test.describe("primitive harness", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/e2e/harness/primitives.html");
  });

  test("dialog traps Tab focus and returns focus on Escape", async ({ page }) => {
    const trigger = page.getByRole("button", { name: "Open settings" });
    await trigger.click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();

    for (let i = 0; i < 6; i++) {
      await page.keyboard.press("Tab");
      expect(await dialog.evaluate((d) => d.contains(document.activeElement))).toBe(true);
    }

    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
  });

  test("select opens, navigates and chooses by keyboard", async ({ page }) => {
    const trigger = page.getByRole("combobox", { name: "Provider" });
    await expect(trigger).toContainText("Select provider");
    await trigger.focus();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("listbox")).toBeVisible();
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Enter");

    const value = await page.getByTestId("provider-value").textContent();
    expect(["openai", "anthropic"]).toContain(value);
    await expect(trigger).toContainText(value === "openai" ? "OpenAI" : "Anthropic");
  });
});

test.describe("migrated primitives on real pages", () => {
  test("agent editor: provider select shows labels and tabs switch panels", async ({ page }) => {
    await page.goto("/agents/new");
    const provider = page.getByRole("combobox").first();
    await provider.click();
    await page.getByRole("option", { name: "Anthropic" }).click();
    await expect(provider).toContainText("Anthropic");

    await page.getByRole("tab", { name: "Preview" }).click();
    await expect(page.getByRole("tab", { name: "Preview" })).toHaveAttribute("aria-selected", "true");
  });

  test("thread: reasoning collapsible exposes its expanded state", async ({ page }) => {
    const thread = APP_ROUTES.find((r) => r.name === "thread")!;
    await page.goto(thread.path);
    await thread.prepare!(page);
    const toggle = page.getByRole("button", { name: /Reasoning/ }).first();
    const before = await toggle.getAttribute("aria-expanded");
    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-expanded", before === "true" ? "false" : "true");
  });
});
