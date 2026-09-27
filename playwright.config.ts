import { defineConfig, devices } from "@playwright/test";

const PORT = Number(process.env.E2E_PORT ?? 4174);

export default defineConfig({
  testDir: "./e2e",
  // Warm the dev server once before workers start (see the file for why).
  globalSetup: "./e2e/support/global-setup.ts",
  outputDir: "./test-results/artifacts",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"], ["html", { outputFolder: "test-results/html", open: "never" }]],
  timeout: 60_000,
  expect: { timeout: 15_000 },
  // Committed goldens (ui-verification-harness spec "Committed golden
  // snapshots"; brand-fidelity-audit design.md decision 4). {platform} is
  // kept in the filename (process.platform, e.g. "darwin") so a Linux CI
  // run can never silently compare its captures against these macOS
  // goldens — it would report every image missing instead, which is the
  // point: a Linux baseline is a separate, later follow-up.
  snapshotPathTemplate: "e2e/__goldens__/{arg}-{platform}{ext}",
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
    contextOptions: { reducedMotion: "reduce" },
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `npx vite --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    // Opt-in reuse: a stale dev server from an earlier run caused slow, flaky runs.
    reuseExistingServer: process.env.E2E_REUSE_SERVER === "1",
    timeout: 120_000,
  },
});
