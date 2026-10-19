/**
 * app-db-reset-notice: when PGlite cannot open the local database, DbProvider
 * deletes it and opens a new one, and the visitor is told once that saved
 * chats on this device were reset (spec chat-persistence, "Visitor is told
 * when saved chats are reset").
 *
 * The real path is reached with the real library. PGlite throws "Invalid FS
 * bundle size" when the `pglite.data` file the page fetched is not the size
 * its WASM was built for, which in production is a stale cached asset after
 * a deploy. The test makes that happen at the network boundary by serving a
 * truncated `pglite.data` to the first open only; nothing in the app is
 * mocked or stubbed. A damaged IndexedDB cannot be used instead: the message
 * comes from the fetched asset's size check, not from stored data.
 */
import type { Page } from "@playwright/test";
import { expect, test } from "./support/test";
import { FIXTURE_THREAD_ID } from "./support/routes";
import { FIXTURE_FINAL_TEXT } from "./fixtures/sse";
import { DB_RESET_NOTICE_CONTENT } from "../content/site/db-reset-notice";

const QUESTION = "What does KnowMe do for small teams?";
/** The title the default UAR mock generates for the thread. */
const THREAD_TITLE = "Weekly plan";
const PGLITE_DATA = /pglite[^/]*\.data(\?.*)?$/;

test.use({ viewport: { width: 1440, height: 900 } });

async function createSavedThread(page: Page): Promise<void> {
  await page.goto(`/threads/${FIXTURE_THREAD_ID}`);
  const composer = page.getByPlaceholder(/Ask your agent anything/i).filter({ visible: true });
  await expect(composer).toBeVisible();
  await page.waitForLoadState("networkidle");
  await composer.fill(QUESTION);
  await composer.press("Enter");
  await expect(page.getByText(FIXTURE_FINAL_TEXT).first()).toBeVisible();
  await expect(page.locator("aside").first().getByText(THREAD_TITLE)).toBeVisible();
  // Reload once so the thread is known to be stored, not only on screen.
  await page.reload();
  await expect(page.locator("aside").first().getByText(THREAD_TITLE)).toBeVisible();
  await page.waitForLoadState("networkidle");
}

test("a normal start shows no reset notice", async ({ page }) => {
  await page.goto(`/threads/${FIXTURE_THREAD_ID}`);
  await expect(page.getByPlaceholder(/Ask your agent anything/i).filter({ visible: true })).toBeVisible();
  await page.waitForLoadState("networkidle");
  await expect(page.getByText(DB_RESET_NOTICE_CONTENT.text)).toHaveCount(0);
});

test("a database that cannot be opened is reset once, with one notice, and the next load is quiet", async ({ page }, testInfo) => {
  await createSavedThread(page);

  let served = 0;
  await page.route(PGLITE_DATA, async (route) => {
    served += 1;
    if (served === 1) {
      // Wrong size on the first open only: PGlite throws, DbProvider purges and retries.
      return route.fulfill({ status: 200, contentType: "application/octet-stream", body: Buffer.alloc(1024) });
    }
    return route.continue();
  });

  await page.reload();

  const notice = page.getByText(DB_RESET_NOTICE_CONTENT.text);
  await expect(notice).toHaveCount(1);
  await expect(notice).toBeVisible();
  expect(served, "pglite.data requests: one bad open, one good reopen").toBe(2);
  // The old chat is gone and the app opened with an empty list.
  await expect(page.locator("aside").first().getByText(THREAD_TITLE)).toHaveCount(0);
  await page.screenshot({ path: testInfo.outputPath("reset-notice.png") });

  // A later load opens the new database normally and says nothing.
  await page.unroute(PGLITE_DATA);
  await page.reload();
  await expect(page.getByPlaceholder(/Ask your agent anything/i).filter({ visible: true })).toBeVisible();
  await page.waitForLoadState("networkidle");
  await expect(page.getByText(DB_RESET_NOTICE_CONTENT.text)).toHaveCount(0);
  await expect(page.locator("aside").first().getByText(THREAD_TITLE)).toHaveCount(0);
});
