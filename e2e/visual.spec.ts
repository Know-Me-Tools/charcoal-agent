/**
 * Screenshot matrix: every route × 320/768/1024/1440 × dark/light.
 * Captures are artifacts for review (test-results/screenshots), not goldens.
 */
import path from "node:path";
import { test } from "./support/test";
import { openRoute, screenshotName, setTheme } from "./support/page-helpers";
import { APP_ROUTES, THEMES, VIEWPORT_HEIGHT, VIEWPORT_WIDTHS } from "./support/routes";

const SCREENSHOT_DIR = path.resolve("test-results/screenshots");

for (const route of APP_ROUTES) {
  test.describe(route.name, () => {
    for (const width of VIEWPORT_WIDTHS) {
      for (const theme of THEMES) {
        test(`${width} › ${theme}`, async ({ page }) => {
          await page.setViewportSize({ width, height: VIEWPORT_HEIGHT });
          await openRoute(page, route);
          await setTheme(page, theme);
          await page.screenshot({
            path: path.join(SCREENSHOT_DIR, screenshotName(route, width, theme)),
            fullPage: true,
            animations: "disabled",
          });
        });
      }
    }
  });
}
