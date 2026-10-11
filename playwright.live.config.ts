import { defineConfig, devices } from "@playwright/test";

/**
 * Real-stack checks: the built site server (compose `knowme-web`) in front of a
 * real UAR and model. No mock, no dev server. Run with `npm run test:live`.
 * Turns call a real model, so they cost tokens and can vary run to run.
 */
export default defineConfig({
  testDir: "./e2e-live",
  outputDir: "./test-results/live-artifacts",
  workers: 1,
  retries: 0,
  reporter: [["list"]],
  timeout: 150_000,
  expect: { timeout: 120_000 },
  use: {
    baseURL: process.env.LIVE_BASE_URL ?? "http://127.0.0.1:8080",
    trace: "retain-on-failure",
    contextOptions: { reducedMotion: "reduce" },
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
