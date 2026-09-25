/**
 * chat-persistence-durability spec (openspec/changes/chat-persistence-durability/
 * specs/chat-persistence/spec.md): local saves (thread + message rows in
 * PGlite/IndexedDB) survive a reload or a closed tab even when it happens
 * immediately after a reply, the save state is observable through
 * `data-persistence`, and a write failure surfaces a plain-language notice
 * without breaking the conversation. This file exercises the real
 * PGlite/IndexedDB path — no fixed waits and no retries stand in for the
 * fix (docs/qa/chat-surfaces-flat2.md §6.15 is the record of why that
 * doesn't work).
 */
import { expect, test } from "./support/test";
import { installUarMock } from "./support/uar-mock";
import { FIXTURE_THREAD_ID } from "./support/routes";
import { ERROR_STREAM_EVENTS, FIXTURE_FINAL_TEXT, RAW_STREAM_ERROR_TEXT, TITLE_RESPONSE, toSseBody } from "./fixtures/sse";

const USER_TEXT = "Plan my week around the rebrand launch.";

/**
 * Mirrors `MESSAGE_ERROR_TEXT` in `src/components/assistant-ui/enhanced-thread.tsx`.
 * Duplicated rather than imported, same as `e2e/chat-surfaces.spec.ts`: that
 * module transitively pulls in a `.css` import (via
 * `enhanced-markdown-text.tsx` → katex), which Playwright's Node-side spec
 * loader cannot resolve outside a browser/Vite context.
 */
const MESSAGE_ERROR_TEXT = "The reply stopped before it finished.";

/**
 * Mirrors `PERSISTENCE_FAILURE_TEXT` in `src/hooks/use-persistence-status.ts`.
 * Duplicated for the same reason as `MESSAGE_ERROR_TEXT` above: that module
 * imports `@/lib/db/write-queue` → `@/lib/db/pglite` → `@electric-sql/pglite`,
 * a WASM package not meant to load outside a browser/Vite context.
 */
const PERSISTENCE_FAILURE_TEXT =
  "Couldn't save your latest messages on this device. They're still on screen, but may be missing after you reload.";

async function openThread(page: import("@playwright/test").Page) {
  await page.goto(`/threads/${FIXTURE_THREAD_ID}`);
  const composer = page.getByPlaceholder(/Ask your agent anything/i).filter({ visible: true });
  await expect(composer).toBeVisible();
  // Matches `support/page-helpers.ts`'s `openRoute`: settle network activity
  // before any `page.evaluate` runs, so an evaluate can't land in the brief
  // window while the page is still finishing its own load/settle work (seen
  // once in a 100-repeat run as a spurious "Execution context was destroyed"
  // from Playwright/Chromium, not a persistence assertion failure).
  await page.waitForLoadState("networkidle");
  return composer;
}

test("Reload immediately after a reply finishes keeps exactly one user message and one reply", async ({ page }) => {
  const composer = await openThread(page);
  await composer.fill(USER_TEXT);
  await composer.press("Enter");

  // Wait for the reply text only — no wait for the save to settle. The
  // page-exit journal, not incidental timing, is what must make this safe.
  await expect(page.getByText(FIXTURE_FINAL_TEXT).first()).toBeVisible();

  await page.reload();

  await expect(page.getByText(FIXTURE_FINAL_TEXT).first()).toBeVisible();
  await expect(page.getByText(USER_TEXT).first()).toBeVisible();
  await expect(page.locator('[data-role="user"]')).toHaveCount(1);
  await expect(page.locator('[data-role="assistant"]')).toHaveCount(1);

  // The thread settles back to `saved` after the reload's own hydration read.
  await expect(page.locator("[data-persistence]")).toHaveAttribute("data-persistence", "saved");
});

test("A reply that ended in an error survives an immediate reload", async ({ page }) => {
  await page.route("**/api/chat/completion", async (route) => {
    const body = route.request().postDataJSON() as { stream?: boolean } | null;
    if (body?.stream === false) {
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(TITLE_RESPONSE) });
    }
    return route.fulfill({ status: 200, contentType: "text/event-stream", body: toSseBody(ERROR_STREAM_EVENTS) });
  });

  const composer = await openThread(page);
  await composer.fill(USER_TEXT);
  await composer.press("Enter");

  await expect(page.getByText(MESSAGE_ERROR_TEXT)).toBeVisible();

  // Reload right after the error is shown, with no deliberate wait.
  await page.reload();

  await expect(page.getByText(USER_TEXT).first()).toBeVisible();
  await expect(page.getByText(MESSAGE_ERROR_TEXT)).toBeVisible();
  await expect(page.locator('[data-role="user"]')).toHaveCount(1);
  await expect(page.locator('[data-role="assistant"]')).toHaveCount(1);
  await expect(page.getByText(RAW_STREAM_ERROR_TEXT)).toHaveCount(0);
});

test("Reopening the thread in a new tab of the same browser context shows the saved reply", async ({ page, context }) => {
  const composer = await openThread(page);
  await composer.fill(USER_TEXT);
  await composer.press("Enter");
  await expect(page.getByText(FIXTURE_FINAL_TEXT).first()).toBeVisible();

  // This scenario is "reopen after the page was finished and closed", not a
  // mid-write race (that's the reload-immediately tests above) — so waiting
  // for the real `saved` signal here, rather than a fixed delay, is the
  // correct way to model a tab that finished and was then closed.
  await expect(page.locator("[data-persistence]")).toHaveAttribute("data-persistence", "saved");
  await page.close();

  const reopened = await context.newPage();
  // A manually created page doesn't get the `uar` auto-fixture's route
  // interception (that's installed per-page by `support/test.ts`'s
  // fixture), so it's installed explicitly here.
  await installUarMock(reopened);
  await reopened.goto(`/threads/${FIXTURE_THREAD_ID}`);

  await expect(reopened.getByText(FIXTURE_FINAL_TEXT).first()).toBeVisible();
  await expect(reopened.getByText(USER_TEXT).first()).toBeVisible();
  await expect(reopened.locator('[data-role="user"]')).toHaveCount(1);
  await expect(reopened.locator('[data-role="assistant"]')).toHaveCount(1);
  await reopened.close();
});

test("data-persistence reads saving while a save is pending and saved once it settles", async ({ page }) => {
  const composer = await openThread(page);

  // A MutationObserver installed before the send captures every attribute
  // change as it happens — there is no polling gap that could miss a
  // transient `saving` state, so this is not a timing-fragile assertion:
  // the write queue sets `pending` synchronously inside `enqueueWrite`
  // (src/lib/db/write-queue.ts), before the async PGlite write starts, so
  // React is guaranteed to render `saving` at least once before `saved`.
  await page.evaluate(() => {
    const root = document.querySelector("[data-persistence]");
    const log: (string | null)[] = [root?.getAttribute("data-persistence") ?? null];
    (window as unknown as { __persistenceLog: (string | null)[] }).__persistenceLog = log;
    if (root) {
      new MutationObserver(() => {
        log.push(root.getAttribute("data-persistence"));
      }).observe(root, { attributes: true, attributeFilter: ["data-persistence"] });
    }
  });

  await composer.fill(USER_TEXT);
  await composer.press("Enter");
  await expect(page.getByText(FIXTURE_FINAL_TEXT).first()).toBeVisible();

  await expect(page.locator("[data-persistence]")).toHaveAttribute("data-persistence", "saved");

  const log = await page.evaluate(
    () => (window as unknown as { __persistenceLog: (string | null)[] }).__persistenceLog,
  );
  expect(log).toContain("saving");
  expect(log[log.length - 1]).toBe("saved");
});

test("A simulated local-write failure shows the plain-language notice once and keeps the conversation usable", async ({
  page,
}) => {
  const composer = await openThread(page);

  // Deterministic write-failure injection, scoped to this test and to
  // `e2e/**` only — nothing in `src/` changes. The database has already
  // opened and the composer is interactive, so this only affects the write
  // this test triggers next, not startup/migrations. `CharcoalDb.open`
  // (src/lib/db/pglite.ts) documents that every write awaits PGlite's
  // `syncToFs()`, which persists dirty pages to IndexedDB via
  // `IDBObjectStore.put`; aborting the transaction behind that `put` is a
  // spec-legal IndexedDB failure (fires a real `error`/`abort` event, the
  // same shape a genuine quota-exceeded or storage-disabled failure would
  // produce), not a fabricated one.
  await page.evaluate(() => {
    const proto = IDBObjectStore.prototype;
    const originalPut = proto.put;
    Object.defineProperty(proto, "put", {
      configurable: true,
      value: function (this: IDBObjectStore, ...args: Parameters<typeof originalPut>) {
        const request = originalPut.apply(this, args);
        try {
          this.transaction.abort();
        } catch {
          // Already aborting or finished — nothing further to do.
        }
        return request;
      },
    });
  });

  await composer.fill(USER_TEXT);
  await composer.press("Enter");
  await expect(page.getByText(FIXTURE_FINAL_TEXT).first()).toBeVisible();

  await expect(page.getByText(PERSISTENCE_FAILURE_TEXT)).toBeVisible();
  await expect(page.locator("[data-persistence]")).toHaveAttribute("data-persistence", "failed");
  // No raw error text (DOMException name, "abort", "quota", etc.) reaches the DOM.
  await expect(page.getByText(/QuotaExceededError|AbortError|DOMException/i)).toHaveCount(0);

  // A burst of failures (every message write in this turn) still produces
  // exactly one toast — the failure-notice element itself, not just its text.
  await expect(page.getByText(PERSISTENCE_FAILURE_TEXT)).toHaveCount(1);

  // The conversation stays usable: the toast didn't block or disable the
  // composer, which still accepts input.
  await expect(composer).toBeEditable();
  await composer.fill("Another message after the failure.");
  await expect(composer).toHaveValue("Another message after the failure.");
});
