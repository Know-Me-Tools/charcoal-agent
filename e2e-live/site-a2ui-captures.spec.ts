/**
 * R7 task 1.3: the finished A2UI card framed at 320 and 1440 in both themes,
 * from one real turn. Run against the live site with LIVE_BASE_URL. Look at the
 * PNGs in test-results/live-captures before calling the card done.
 */
import { expect, test } from "@playwright/test";
import { randomUUID } from "node:crypto";

const WIDTHS = [320, 1440] as const;
const THEMES = ["light", "dark"] as const;

test("the A2UI card holds up at 320 and 1440 in both themes", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`/threads/${randomUUID()}`);
  const composer = page.getByPlaceholder(/Ask your agent anything/i).filter({ visible: true });
  await composer.fill("What is The Boss?");
  await composer.press("Enter");

  const surface = page.getByTestId("a2ui-surface");
  await expect(surface).toBeVisible();
  await expect(page.getByRole("button", { name: "Stop generating" })).toHaveCount(0);

  for (const width of WIDTHS) {
    for (const theme of THEMES) {
      await page.setViewportSize({ width, height: 900 });
      await page.evaluate(
        (dark) => document.documentElement.classList.toggle("dark", dark),
        theme === "dark",
      );
      await surface.evaluate((el) => el.scrollIntoView({ block: "center" }));
      // Nothing may scroll sideways at this width.
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow, `${width}px ${theme}: horizontal overflow`).toBeLessThanOrEqual(0);
      await page.screenshot({ path: `test-results/live-captures/card-${width}-${theme}.png` });
    }
  }
});
