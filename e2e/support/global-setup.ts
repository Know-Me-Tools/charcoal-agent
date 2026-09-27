/**
 * Warms the dev server before any worker starts. On a freshly started Vite
 * server, the first page load compiles the app and serves PGlite's WASM and
 * data (~5 MB). With several workers doing that at once, some loads stayed on
 * "Bootstrapping schema migrations…" past the 60 s test timeout (a11y and
 * chat-surfaces goto timeouts). One sequential load here pays that cost once;
 * Vite then serves every later request from its in-memory transform cache.
 */
import { chromium, type FullConfig } from "@playwright/test";
import { installUarMock } from "./uar-mock";
import { FIXTURE_THREAD_ID } from "./routes";

export default async function globalSetup(config: FullConfig): Promise<void> {
  const baseURL = config.projects[0]?.use.baseURL;
  if (!baseURL) return;
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await installUarMock(page);
    await page.goto(`${baseURL}/threads/${FIXTURE_THREAD_ID}`, { timeout: 180_000 });
    await page
      .getByText("Bootstrapping schema migrations…")
      .waitFor({ state: "detached", timeout: 180_000 });
    await page.goto(`${baseURL}/`, { timeout: 180_000 });
  } finally {
    await browser.close();
  }
}
