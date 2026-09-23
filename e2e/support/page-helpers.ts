import { expect, type Page } from "@playwright/test";
import type { AppRoute, Theme } from "./routes";
import { FIXED_TIME } from "../fixtures/uar-data";

/**
 * Apply a theme. The app toggles a `dark` class on <html> (default dark, not yet
 * persisted); this is the single place to change when theme persistence lands.
 */
export async function setTheme(page: Page, theme: Theme): Promise<void> {
  await page.evaluate((t) => {
    document.documentElement.classList.toggle("dark", t === "dark");
  }, theme);
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => r(null))));
}

/** Navigate, run any route preparation, and wait until real content is visible. */
export async function openRoute(page: Page, route: AppRoute): Promise<void> {
  // Freeze the clock so relative/absolute timestamps render identically every run.
  await page.clock.setFixedTime(new Date(FIXED_TIME));
  await page.goto(route.path);
  await expect(page.getByText(route.readyText).filter({ visible: true }).first()).toBeVisible();
  if (route.prepare) await route.prepare(page);
  await page.waitForLoadState("networkidle");
  await page.evaluate(() => document.fonts.ready);
}

export function screenshotName(route: AppRoute, width: number, theme: Theme): string {
  return `${route.name}__${width}__${theme}.png`;
}
