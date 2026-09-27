/**
 * Screenshot matrix: every route × 320/768/1024/1440 × dark/light.
 *
 * Two artifacts per capture (ui-verification-harness spec "Committed golden
 * snapshots"; brand-fidelity-audit design.md decision 4):
 * - a review capture under test-results/screenshots/ (git-ignored), which
 *   km-creative-director's reference comparison reads;
 * - a committed golden under e2e/__goldens__/ (playwright.config.ts
 *   snapshotPathTemplate), compared via toHaveScreenshot — this is the
 *   actual regression gate `npm run test:visual` enforces.
 *
 * openRoute() (support/page-helpers.ts) calls page.clock.setFixedTime()
 * before navigation, so clock-derived text (the sidebar's relative
 * timestamps) renders identically on every run without a mask. Anything
 * else that turns out not to be deterministic shows up as a diff on the
 * second, non-`--update-snapshots` run (design.md decision 4's determinism
 * check) and gets masked then, with the mask recorded in
 * docs/qa/brand-fidelity-audit.md.
 */
import path from "node:path";
import { expect, test } from "./support/test";
import { openRoute, screenshotName, seedTheme } from "./support/page-helpers";
import { APP_ROUTES, THEMES, VIEWPORT_HEIGHT, VIEWPORT_WIDTHS } from "./support/routes";

const SCREENSHOT_DIR = path.resolve("test-results/screenshots");

// Full-page captures of the expanded thread (~2,700px tall) can exceed the
// default 60s under parallel load; seen once each in two changes' full runs.
test.describe.configure({ timeout: 90_000 });

for (const route of APP_ROUTES) {
  test.describe(route.name, () => {
    for (const width of VIEWPORT_WIDTHS) {
      for (const theme of THEMES) {
        test(`${width} › ${theme}`, async ({ page }) => {
          await page.setViewportSize({ width, height: VIEWPORT_HEIGHT });
          await seedTheme(page, theme);
          await openRoute(page, route);

          await page.screenshot({
            path: path.join(SCREENSHOT_DIR, screenshotName(route, width, theme)),
            fullPage: true,
            animations: "disabled",
          });

          await expect(page).toHaveScreenshot(screenshotName(route, width, theme), {
            fullPage: true,
            animations: "disabled",
            maxDiffPixelRatio: 0.002,
          });
        });
      }
    }
  });
}
