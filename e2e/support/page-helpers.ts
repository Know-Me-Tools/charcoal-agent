import { expect, type Page } from "@playwright/test";
import type { AppRoute, Theme } from "./routes";
import { FIXED_TIME } from "../fixtures/uar-data";

/**
 * Apply a theme the way the app does: persist it under `knowme:ui` (read by the
 * pre-paint script and the ui store) and toggle the `.dark` class now.
 */
export async function setTheme(page: Page, theme: Theme): Promise<void> {
  await page.evaluate((t) => {
    const key = "knowme:ui";
    const saved = JSON.parse(localStorage.getItem(key) ?? "{}") as { state?: Record<string, unknown> };
    localStorage.setItem(key, JSON.stringify({ state: { ...saved.state, theme: t }, version: 0 }));
    document.documentElement.classList.toggle("dark", t === "dark");
  }, theme);
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => r(null))));
}

/**
 * Seed the saved theme before the app loads, exactly as a returning user's
 * preference is applied (pre-paint script + ui store rehydration).
 */
export async function seedTheme(page: Page, theme: Theme): Promise<void> {
  await page.addInitScript((t) => {
    localStorage.setItem("knowme:ui", JSON.stringify({ state: { theme: t, fontSize: "default" }, version: 0 }));
  }, theme);
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
