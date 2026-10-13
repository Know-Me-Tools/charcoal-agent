/**
 * A finished thread is listed in the sidebar after a real page reload, and is
 * named from the visitor's question. Regression for the live bug where the
 * list was empty after reload because the reopened thread's route re-registered
 * it as an ephemeral row and overwrote the stored (persisted, titled) row.
 */
import { expect, test } from "./support/test";
import { FIXTURE_THREAD_ID } from "./support/routes";
import { FIXTURE_FINAL_TEXT, FIXTURE_EVENTS, toSseBody } from "./fixtures/sse";

const QUESTION = "What does KnowMe do for small teams?";

test.use({ viewport: { width: 1440, height: 900 } });

test("a finished thread stays listed, with its generated title, after reload", async ({ page }) => {
  await page.goto(`/threads/${FIXTURE_THREAD_ID}`);
  const composer = page.getByPlaceholder(/Ask your agent anything/i).filter({ visible: true });
  await expect(composer).toBeVisible();
  await page.waitForLoadState("networkidle");
  await composer.fill(QUESTION);
  await composer.press("Enter");
  await expect(page.getByText(FIXTURE_FINAL_TEXT).first()).toBeVisible();
  await expect(page.locator("aside").first().getByText("Weekly plan")).toBeVisible();

  // Reload twice: the first reopen must not rewrite the stored row as an
  // ephemeral one, which only shows on the next load.
  for (let reload = 0; reload < 2; reload += 1) {
    await page.reload();
    await expect(page.getByText(FIXTURE_FINAL_TEXT).first()).toBeVisible();
    await expect(page.locator("aside").first().getByText("Weekly plan")).toBeVisible();
    await page.waitForLoadState("networkidle");
  }
});

test("a finished thread is listed and named from the question after reload", async ({ page }) => {
  // Title generation is unavailable, as on the live site: the title must still come from the question.
  await page.route("**/api/chat/completion", async (route) => {
    const body = route.request().postDataJSON() as { stream?: boolean } | null;
    if (body?.stream === false) return route.fulfill({ status: 500, body: "title unavailable" });
    return route.fulfill({ status: 200, contentType: "text/event-stream", body: toSseBody(FIXTURE_EVENTS) });
  });

  await page.goto(`/threads/${FIXTURE_THREAD_ID}`);
  const composer = page.getByPlaceholder(/Ask your agent anything/i).filter({ visible: true });
  await expect(composer).toBeVisible();
  await page.waitForLoadState("networkidle");
  await composer.fill(QUESTION);
  await composer.press("Enter");
  await expect(page.getByText(FIXTURE_FINAL_TEXT).first()).toBeVisible();

  const sidebar = page.locator("aside").first();
  await expect(sidebar.getByText(QUESTION)).toBeVisible();
  await expect(sidebar.getByText("New conversation")).toHaveCount(0);

  await page.reload();
  await expect(page.getByText(FIXTURE_FINAL_TEXT).first()).toBeVisible();
  await expect(page.locator("aside").first().getByText(QUESTION)).toBeVisible();
  await expect(page.locator("aside").first().getByText("New conversation")).toHaveCount(0);
});
