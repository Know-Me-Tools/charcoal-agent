/**
 * Which browser the suite launches.
 *
 * By default Playwright uses its own bundled Chromium. Set
 * `PLAYWRIGHT_CHANNEL=chrome` to force the installed Google Chrome instead.
 * When the bundled Chromium is not installed (a machine or worktree where
 * `npx playwright install` was never run), Chrome is used automatically.
 * Shared by `playwright.config.ts` and `global-setup.ts` so both pick the
 * same browser.
 */
import { existsSync } from "node:fs";
import { chromium } from "@playwright/test";

export function browserChannel(): "chrome" | undefined {
  if (process.env.PLAYWRIGHT_CHANNEL === "chrome") return "chrome";
  try {
    return existsSync(chromium.executablePath()) ? undefined : "chrome";
  } catch {
    return "chrome";
  }
}
