/**
 * app-first-send-thread-order: a message is never written before its thread
 * row. Runs on the Vite dev server because it holds the thread registry's
 * hydration back by rewriting the served `use-db-hydration.ts` module in the
 * browser (page.route); nothing in src/ is changed. Everything else is real:
 * the app, PGlite, the write queue. The UAR backend is the suite's usual mock.
 *
 * Without the guard in use-chat-runtime.ts a first send that lands before the
 * registry is hydrated enqueues the message ahead of the thread row, violates
 * messages_thread_id_fkey, shows the save-failure toast, leaves the thread
 * hidden from the sidebar and loses the first exchange on a reload.
 */
import type { Page } from "@playwright/test";
import { expect, test } from "./support/test";
import { FIXTURE_THREAD_ID } from "./support/routes";
import { FIXTURE_FINAL_TEXT } from "./fixtures/sse";

const QUESTION = "What does KnowMe do for small teams?";
const SECOND_QUESTION = "And for a solo founder?";
/** The title the default UAR mock generates for a thread. */
const THREAD_TITLE = "Weekly plan";
const FAILURE_TOAST = /Couldn't save your latest messages/;
const HYDRATION_MODULE = "**/src/hooks/use-db-hydration.ts*";
/** Under the send's 2 s wait cap, over the measured 100 to 500 ms gap. */
const HYDRATION_DELAY_MS = 1000;

/** Serve use-db-hydration.ts with its stored-threads read delayed or failing. */
async function holdHydration(page: Page, read: "delay" | "fail"): Promise<() => void> {
  let applied = 0;
  await page.route(HYDRATION_MODULE, async (route) => {
    const resp = await route.fetch();
    const src = await resp.text();
    const replacement =
      read === "delay"
        ? `new Promise((r) => setTimeout(r, ${HYDRATION_DELAY_MS})).then(() => db.getThreads())`
        : `Promise.reject(new Error("stored threads unreadable"))`;
    const out = src.replace("db.getThreads()", replacement);
    if (out !== src) applied += 1;
    await route.fulfill({ response: resp, body: out });
  });
  return () => expect(applied, "the hydration read was held back").toBeGreaterThan(0);
}

const composerOf = (page: Page) => page.getByPlaceholder(/Ask your agent anything/i).filter({ visible: true });
const sidebarOf = (page: Page) => page.locator("aside").first();

async function sendNow(page: Page, text: string): Promise<void> {
  const composer = composerOf(page);
  await expect(composer).toBeVisible();
  await composer.fill(text);
  await composer.press("Enter");
}

test("an unknown thread id sent to before hydration: thread row first, both messages kept", async ({ page }) => {
  const held = await holdHydration(page, "delay");
  await page.goto(`/threads/${FIXTURE_THREAD_ID}`);
  await sendNow(page, QUESTION);
  await expect(page.getByText(FIXTURE_FINAL_TEXT).first()).toBeVisible();
  // Reply on screen while hydration is still held back: no failed write yet.
  await expect(page.getByText(FAILURE_TOAST)).toHaveCount(0);

  // After hydration the thread is in the sidebar with its generated title.
  await expect(sidebarOf(page).getByText(THREAD_TITLE)).toBeVisible();
  await expect(page.getByText(FAILURE_TOAST)).toHaveCount(0);
  held();

  // Reload (hydration no longer held): both messages of the exchange are there.
  await page.unroute(HYDRATION_MODULE);
  await page.reload();
  await expect(page.getByText(QUESTION)).toBeVisible();
  await expect(page.getByText(FIXTURE_FINAL_TEXT).first()).toBeVisible();
  await expect(sidebarOf(page).getByText(THREAD_TITLE)).toBeVisible();
});

test("a stored thread opened by URL and sent to at once keeps its title and earlier messages", async ({ page }) => {
  // Make a stored thread the ordinary way.
  await page.goto(`/threads/${FIXTURE_THREAD_ID}`);
  await sendNow(page, QUESTION);
  await expect(page.getByText(FIXTURE_FINAL_TEXT).first()).toBeVisible();
  await expect(sidebarOf(page).getByText(THREAD_TITLE)).toBeVisible();
  await page.reload();
  await expect(sidebarOf(page).getByText(THREAD_TITLE)).toBeVisible();
  await page.waitForLoadState("networkidle");

  // Reopen its URL with hydration held back and send straight away.
  const held = await holdHydration(page, "delay");
  await page.reload();
  await sendNow(page, SECOND_QUESTION);
  await expect(sidebarOf(page).getByText(THREAD_TITLE)).toBeVisible();
  held();
  await expect(page.getByText(FAILURE_TOAST)).toHaveCount(0);

  // The thread was not replaced by a new ephemeral one: title kept, both exchanges there.
  await page.unroute(HYDRATION_MODULE);
  await page.reload();
  await expect(sidebarOf(page).getByText(THREAD_TITLE)).toBeVisible();
  await expect(sidebarOf(page).getByText("New conversation")).toHaveCount(0);
  await expect(page.getByText(QUESTION)).toBeVisible();
  await expect(page.getByText(SECOND_QUESTION)).toBeVisible();
});

test("a failed read of the stored threads does not stop a send", async ({ page }) => {
  const held = await holdHydration(page, "fail");
  await page.goto(`/threads/${FIXTURE_THREAD_ID}`);
  await sendNow(page, QUESTION);
  await expect(page.getByText(FIXTURE_FINAL_TEXT).first()).toBeVisible();
  held();
  await expect(sidebarOf(page).getByText(THREAD_TITLE)).toBeVisible();
  await expect(page.getByText(FAILURE_TOAST)).toHaveCount(0);
});

test("the landing composer path (thread registered first) is unchanged", async ({ page }) => {
  const held = await holdHydration(page, "delay");
  await page.goto("/");
  await page.locator("form textarea").first().fill(QUESTION);
  await page.locator("form textarea").first().press("Enter");
  await expect(page).toHaveURL(/\/threads\//);
  await expect(page.getByText(FIXTURE_FINAL_TEXT).first()).toBeVisible();
  await expect(sidebarOf(page).getByText(THREAD_TITLE)).toBeVisible();
  held();
  await expect(page.getByText(FAILURE_TOAST)).toHaveCount(0);
});
