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
 * Mirrors `PERSISTENCE_FAILURE_TEXT` in
 * `src/components/common/persistence-notices.tsx`. Duplicated for the same
 * reason as `MESSAGE_ERROR_TEXT` above: that module imports
 * `@/lib/db/write-queue` → `@/lib/db/pglite` → `@electric-sql/pglite`, a
 * WASM package not meant to load outside a browser/Vite context.
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
  // verification.md row 15's missing clause: "the database error is logged
  // for diagnosis, not displayed" — asserted below via the page's own
  // console events, which capture `write-queue.ts`'s `reportFailure`
  // (`console.error('[write-queue] ...failed', error)`) exactly as a real
  // browser or CI log would.
  const consoleErrors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });

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

  // The database error IS logged for diagnosis — through the write queue's
  // own console.error, not the raw error text reaching the UI above.
  expect(consoleErrors.some((line) => line.includes("[write-queue]") && line.includes("failed"))).toBe(true);

  // A burst of failures (every message write in this turn) still produces
  // exactly one toast — the failure-notice element itself, not just its text.
  await expect(page.getByText(PERSISTENCE_FAILURE_TEXT)).toHaveCount(1);

  // The conversation stays usable: the toast didn't block or disable the
  // composer, which still accepts input.
  await expect(composer).toBeEditable();
  await composer.fill("Another message after the failure.");
  await expect(composer).toHaveValue("Another message after the failure.");
});

// ─── Deterministic journal proof (verification.md row 16 / the critic's
// "uncomfortable thing"): the earlier reload tests above prove the app
// SURVIVES an immediate reload, but never prove the JOURNAL did it — they
// never check that a write was actually still pending at reload, or that
// the journal key existed. This test makes the queue provably non-empty at
// reload time (every IndexedDB write is held pending, not merely slow or
// failed), asserts the journal key + its pending descriptors directly from
// localStorage BEFORE the reload, then asserts the reply survives and the
// key is gone AFTER it. §3 of docs/qa/chat-persistence-durability.md
// records running this same test in a scratch copy with
// `installPersistenceJournal()` disabled, where it fails every time. ─────

const JOURNAL_KEY_PREFIX = "knowme-pending-writes-v1";
const TAB_ID_STORAGE_KEY = "knowme-tab-id";

/**
 * Holds every subsequent IndexedDB write pending forever: lets the real
 * `put()` call and its transaction proceed for real at the browser/engine
 * level (nothing crashes or gets corrupted), but globally swallows the
 * completion notifications (`onsuccess`/`onerror`/`oncomplete`/`onabort`
 * and their `addEventListener` equivalents) on both `IDBRequest` and
 * `IDBTransaction`, so whichever one PGlite/IDBFS's `syncToFs` listens on
 * (`src/lib/db/pglite.ts`'s `CharcoalDb.open` comment), its callback never
 * fires and the promise the write queue is awaiting never settles. Proven
 * necessary empirically: swallowing only `IDBObjectStore.prototype.put`'s
 * own request left `data-persistence` at "saved" (an idle transaction with
 * no other outstanding request auto-commits almost immediately) — the
 * write queue must be awaiting the transaction's completion, not only the
 * request's.
 */
async function holdWritesPending(page: import("@playwright/test").Page): Promise<void> {
  await page.evaluate(() => {
    const swallowed = new Set(["success", "error", "complete", "abort"]);
    for (const proto of [IDBRequest.prototype, IDBTransaction.prototype]) {
      for (const name of ["onsuccess", "onerror", "oncomplete", "onabort"]) {
        if (!(name in proto)) continue;
        Object.defineProperty(proto, name, {
          configurable: true,
          get() {
            return undefined;
          },
          set() {
            // swallow — never actually registers a handler
          },
        });
      }
      const originalAdd = proto.addEventListener;
      Object.defineProperty(proto, "addEventListener", {
        configurable: true,
        value: function (type: string, ...rest: unknown[]) {
          if (swallowed.has(type)) return;
          // @ts-expect-error — generic passthrough to the real addEventListener
          return originalAdd.call(this, type, ...rest);
        },
      });
    }
  });
}

test("A write held pending at reload is journaled to this tab's own key and replayed on the next start", async ({
  page,
}) => {
  const composer = await openThread(page);
  await holdWritesPending(page);

  await composer.fill(USER_TEXT);
  await composer.press("Enter");
  await expect(page.getByText(FIXTURE_FINAL_TEXT).first()).toBeVisible();

  // The queue is guaranteed non-empty: the held writes never settle, so
  // `data-persistence` cannot reach "saved" — this is not a timing sample,
  // it's structurally guaranteed by the injection above.
  await expect(page.locator("[data-persistence]")).toHaveAttribute("data-persistence", "saving");

  const tabId = await page.evaluate((k) => sessionStorage.getItem(k), TAB_ID_STORAGE_KEY);
  expect(tabId).toBeTruthy();
  const journalKey = `${JOURNAL_KEY_PREFIX}:${tabId}`;

  // Force the exit-journal write via a real `visibilitychange` (the same
  // signal `pagehide` covers, and the one that also fires on mobile) before
  // reloading, so the journal's content can be read from THIS page before
  // `page.reload()` tears down its JS context.
  await page.evaluate(() => {
    Object.defineProperty(document, "visibilityState", { configurable: true, get: () => "hidden" });
    document.dispatchEvent(new Event("visibilitychange"));
  });

  const journalBefore = await page.evaluate((k) => localStorage.getItem(k), journalKey);
  expect(journalBefore).not.toBeNull();
  const parsed = JSON.parse(journalBefore as string) as { version: number; descriptors: { kind: string }[] };
  expect(parsed.version).toBe(1);
  expect(parsed.descriptors.length).toBeGreaterThan(0);
  expect(parsed.descriptors.some((d) => d.kind === "upsertMessage")).toBe(true);

  // Reload: the in-page injection above doesn't survive navigation, so the
  // new page's IndexedDB is back to normal — replay runs against the real
  // path, inside `CharcoalDb.open`'s caller, before the app is shown ready.
  await page.reload();

  await expect(page.getByText(FIXTURE_FINAL_TEXT).first()).toBeVisible();
  await expect(page.getByText(USER_TEXT).first()).toBeVisible();
  await expect(page.locator('[data-role="user"]')).toHaveCount(1);
  await expect(page.locator('[data-role="assistant"]')).toHaveCount(1);

  const journalAfter = await page.evaluate((k) => localStorage.getItem(k), journalKey);
  expect(journalAfter).toBeNull();
});

// ─── PARTIAL rows from verification.md, standing coverage ──────────────────

/**
 * Patches `IDBObjectStore.prototype.put` so every write aborts its own
 * transaction (a real IndexedDB error, not fabricated — see the earlier
 * failure test's comment), saving the ORIGINAL function on `window` so it
 * can be genuinely restored afterward. `put` is natively defined directly
 * on `IDBObjectStore.prototype` (not inherited), so `delete`-ing an
 * override leaves no `put` at all — every future write would then throw
 * forever instead of recovering. Pair with `restorePutAbortsWrites`.
 *
 * Also counts every aborted `put` call on `window.__putAbortCount`, reset to
 * 0 on each call — verification.md row 14's "prove more than one write
 * failed in that burst", read back directly instead of inferred from a
 * fixed wait.
 */
async function patchPutAbortsWrites(page: import("@playwright/test").Page): Promise<void> {
  await page.evaluate(() => {
    const proto = IDBObjectStore.prototype;
    const originalPut = proto.put;
    (window as unknown as { __originalPut: typeof originalPut }).__originalPut = originalPut;
    (window as unknown as { __putAbortCount: number }).__putAbortCount = 0;
    Object.defineProperty(proto, "put", {
      configurable: true,
      value: function (this: IDBObjectStore, ...args: Parameters<typeof originalPut>) {
        (window as unknown as { __putAbortCount: number }).__putAbortCount++;
        const request = originalPut.apply(this, args);
        try {
          this.transaction.abort();
        } catch {
          /* already aborting/finished */
        }
        return request;
      },
    });
  });
}

async function restorePutAbortsWrites(page: import("@playwright/test").Page): Promise<void> {
  await page.evaluate(() => {
    const proto = IDBObjectStore.prototype;
    const original = (window as unknown as { __originalPut: typeof proto.put }).__originalPut;
    Object.defineProperty(proto, "put", { configurable: true, writable: true, value: original });
  });
}

test("The failed save state clears back to saved after a later write succeeds", async ({ page }) => {
  const composer = await openThread(page);
  await patchPutAbortsWrites(page);

  await composer.fill(USER_TEXT);
  await composer.press("Enter");
  await expect(page.getByText(FIXTURE_FINAL_TEXT).first()).toBeVisible();
  await expect(page.locator("[data-persistence]")).toHaveAttribute("data-persistence", "failed");

  // Restore normal IndexedDB behaviour, then send again: a later write must
  // succeed and the save state must clear back to "saved" — not stay
  // latched at "failed" from the earlier burst.
  await restorePutAbortsWrites(page);

  await composer.fill("A second message after recovery.");
  await composer.press("Enter");
  await expect(page.getByText(FIXTURE_FINAL_TEXT).nth(1)).toBeVisible();
  await expect(page.locator("[data-persistence]")).toHaveAttribute("data-persistence", "saved", {
    timeout: 20_000,
  });
});

test("A failed save keeps focus in the composer, the reply on screen, and the composer usable for a further send", async ({
  page,
}) => {
  const composer = await openThread(page);
  await composer.focus();
  await patchPutAbortsWrites(page);

  await composer.fill(USER_TEXT);
  await composer.press("Enter");
  await expect(page.getByText(FIXTURE_FINAL_TEXT).first()).toBeVisible();
  await expect(page.getByText(PERSISTENCE_FAILURE_TEXT)).toBeVisible();

  // Re-check after the toast moved top-center (verification.md finding 5):
  // it must not overlap the composer, must not steal focus, the reply must
  // still be on screen with the notice showing, and the composer must
  // actually be able to SEND a further message, not merely accept text.
  const toastBox = await page.getByText(PERSISTENCE_FAILURE_TEXT).boundingBox();
  const composerBox = await composer.boundingBox();
  const overlaps =
    toastBox && composerBox
      ? !(
          toastBox.x + toastBox.width <= composerBox.x ||
          composerBox.x + composerBox.width <= toastBox.x ||
          toastBox.y + toastBox.height <= composerBox.y ||
          composerBox.y + composerBox.height <= toastBox.y
        )
      : null;
  expect(overlaps).toBe(false);

  const activeIsComposer = await composer.evaluate((el) => el === document.activeElement);
  expect(activeIsComposer).toBe(true);

  await expect(page.getByText(FIXTURE_FINAL_TEXT).first()).toBeVisible();

  // Restore normal writes, then prove the composer can genuinely SEND, not
  // just accept typed text.
  await restorePutAbortsWrites(page);
  await composer.fill("Another message after the failure.");
  await composer.press("Enter");
  await expect(page.getByText(FIXTURE_FINAL_TEXT).nth(1)).toBeVisible();
  await expect(page.locator('[data-role="user"]')).toHaveCount(2);
  await expect(page.locator('[data-role="assistant"]')).toHaveCount(2);
});

test("A burst of failing writes from one turn shows exactly one toast element", async ({ page }) => {
  // Each failed write logs its own `[write-queue] <descriptor> failed` line
  // (`reportFailure` in write-queue.ts, one call per failing descriptor) —
  // a precise, per-write count, unlike the aborted-`put`-call count below
  // (PGlite's WASM filesystem sync can issue more than one `put` per single
  // logical write, so that count alone over-counts).
  const writeQueueFailures: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error" && msg.text().includes("[write-queue]") && msg.text().includes("failed")) {
      writeQueueFailures.push(msg.text());
    }
  });

  const composer = await openThread(page);
  await patchPutAbortsWrites(page);

  // Registered BEFORE sending, so it can't race a response that already
  // happened by the time we look for it: the non-streaming
  // title-generation request this turn's `onComplete` awaits before calling
  // `setTitle` (`use-chat-runtime.ts`'s `afterStreamComplete`) — the last
  // write this burst enqueues.
  const titleResponse = page.waitForResponse((response) => {
    if (!response.url().includes("/api/chat/completion")) return false;
    const body = response.request().postDataJSON() as { stream?: boolean } | null;
    return body?.stream === false;
  });

  await composer.fill(USER_TEXT);
  await composer.press("Enter");
  await expect(page.getByText(FIXTURE_FINAL_TEXT).first()).toBeVisible();
  await expect(page.getByText(PERSISTENCE_FAILURE_TEXT)).toBeVisible();
  // Established by the time the reply and notice above are visible: the
  // burst's first two failures (`markPersisted`'s and the message writes')
  // have already landed. This does NOT by itself prove the LAST write this
  // burst enqueues (`setTitle`, after the title round trip below) has
  // failed yet — see the poll below, which is what actually establishes
  // that.
  await expect(page.locator("[data-persistence]")).toHaveAttribute("data-persistence", "failed");

  await titleResponse;

  // Deterministic settle point for the burst's LAST write: `setTitle`'s own
  // `upsertThread(<threadId>)` write (`descriptorLabel` in write-queue.ts),
  // enqueued only after `afterStreamComplete` (use-chat-runtime.ts) awaits
  // the just-resolved title-generation response. `data-persistence` alone
  // can't distinguish this from the earlier failures: it reads "failed"
  // from `markPersisted`'s failure well before `setTitle` is even queued
  // (that's the defect this replaces — the old two `toHaveAttribute`
  // rechecks above and below `titleResponse` could both pass without
  // `setTitle`'s write having settled at all). And the label itself isn't
  // unique to `setTitle`: `markPersisted` enqueues an `upsertThread` write
  // for the same thread id and produces an identical string. So this polls
  // for a SECOND occurrence of that exact label in the write-queue's own
  // failure log — which can only exist once `setTitle`'s write has also
  // failed, since the first occurrence is already accounted for by
  // `markPersisted` above.
  const titleWriteLabel = `upsertThread(${FIXTURE_THREAD_ID})`;
  await expect
    .poll(() => writeQueueFailures.filter((line) => line.includes(titleWriteLabel)).length)
    .toBeGreaterThanOrEqual(2);

  // Prove more than one write actually failed in this burst — not just
  // that the notice showed once (verification.md row 14) — by counting the
  // distinct writes the queue itself reported as failed.
  expect(writeQueueFailures.length).toBeGreaterThan(1);

  // Secondary signal: more than one real IndexedDB `put` call was aborted
  // too (the patch's own count), confirming the failures were genuine
  // IndexedDB errors and not merely queue bookkeeping.
  const putAbortCount = await page.evaluate(
    () => (window as unknown as { __putAbortCount?: number }).__putAbortCount ?? 0,
  );
  expect(putAbortCount).toBeGreaterThan(1);

  // Count actual rendered toast elements (sonner), not just text matches —
  // a stacked second toast with the SAME text would still pass a text-count
  // assertion but fail this one. Honestly: this assertion guards the
  // STABLE TOAST ID behaviour (`persistence-notices.tsx`'s `FAILURE_TOAST_ID`,
  // which updates one toast in place instead of stacking a new one per
  // failure) — it does not by itself prove every failure in the burst was
  // individually observed; `writeQueueFailures.length` and `putAbortCount`
  // above already cover that.
  const toastElements = page.locator("[data-sonner-toast]");
  await expect(toastElements).toHaveCount(1);
});

test("A replay failure at startup shows the notice once the app is ready, and the app still finishes starting", async ({
  page,
}) => {
  // First boot normally to get this tab's id assigned and a fresh DB, then
  // hand-write a journal entry for this tab's own key that WILL fail on
  // replay: a message with a role the `messages.role` CHECK constraint
  // rejects (`pglite.ts`'s migration v1) — a deterministic, guaranteed SQL
  // failure, not a fabricated one.
  const composer = await openThread(page);
  const tabId = await page.evaluate((k) => sessionStorage.getItem(k), TAB_ID_STORAGE_KEY);
  expect(tabId).toBeTruthy();
  const journalKey = `${JOURNAL_KEY_PREFIX}:${tabId}`;

  // Planted by an init script on the NEXT load, before any app code runs.
  // Writing it from this page instead raced the app: `syncJournalIfPresent`
  // rewrites or clears this tab's key on every queue change, so a write of
  // this page settling after the plant erased the entry before reload and
  // replay had nothing to fail (3/80 at --workers=5). The sessionStorage
  // flag keeps later navigations from planting it again.
  await page.addInitScript(
    ({ key, threadId }) => {
      if (sessionStorage.getItem("e2e-planted-replay-failure")) return;
      sessionStorage.setItem("e2e-planted-replay-failure", "1");
      const payload = {
        version: 1,
        descriptors: [
          {
            kind: "upsertMessage",
            threadId,
            message: {
              id: "startup-replay-failure-message",
              role: "not-a-real-role",
              content: [],
              createdAt: new Date().toISOString(),
              status: "complete",
            },
          },
        ],
      };
      localStorage.setItem(key, JSON.stringify(payload));
    },
    { key: journalKey, threadId: FIXTURE_THREAD_ID },
  );

  // Reload: `DbProvider` opens the DB, then `replayJournal` runs BEFORE
  // `ready: true` — before `PersistenceNotices` (or anything else) has
  // mounted to receive the failure. The write queue's `pendingNotice` latch
  // (`src/lib/db/write-queue.ts`) is what should carry it to the first
  // subscriber once the app IS ready — this is the CRITICAL fix from
  // verification.md row 18.
  //
  // `data-persistence` itself is deliberately NOT asserted here: this
  // thread is still ephemeral (never sent a message), so the ONLY writes on
  // this boot are the failed replay entry and the normal `registerThread`
  // upsert. `EnhancedThread` doesn't mount until after message hydration,
  // and a bare `upsertThread` for an already-migrated row settles in low
  // single-digit milliseconds — empirically (a diagnostic node-side poll
  // sampled every readable value) `failed` has already cleared back to
  // `saved` by the time the thread root first exists in the DOM, before
  // Playwright can observe it, and even a `MutationObserver` installed via
  // `addInitScript` (the earliest possible hook) never captured a "failed"
  // mutation. That's consistent with spec.md's "failed until a later write
  // succeeds", not a defect: the notice (asserted below) is the part of row
  // 18 this scenario can actually exercise, since it fires from the latch
  // the instant the first subscriber mounts, independent of how fast the
  // save state itself later clears.
  await page.reload();

  // The app finishes starting despite the replay failure (composer usable).
  await expect(composer).toBeVisible();
  await expect(composer).toBeEditable();

  await expect(page.getByText(PERSISTENCE_FAILURE_TEXT)).toBeVisible();
  await expect(page.getByText(PERSISTENCE_FAILURE_TEXT)).toHaveCount(1);

  // The bad entry is discarded (not retried forever) and no raw error text leaks.
  const journalAfter = await page.evaluate((k) => localStorage.getItem(k), journalKey);
  expect(journalAfter).toBeNull();
  await expect(page.getByText(/not-a-real-role|CheckViolation|constraint/i)).toHaveCount(0);
});

test("A write failure on a non-thread route still shows the app-wide notice", async ({ page }) => {
  // `app-layout.tsx`'s `showSidebar` is true only for `/threads*` or `/`,
  // and `/threads` itself immediately redirects to the latest persisted
  // thread (`threads-page.tsx`) — so there is no reachable route where the
  // sidebar (and so a thread-registry action) is visible without ALSO being
  // a thread detail view. The real, naturally-occurring way a thread
  // registry write fires while the user is elsewhere is title generation:
  // `use-chat-runtime.ts`'s `afterStreamComplete` awaits
  // `generateThreadTitle` (a separate non-streaming request) and only THEN
  // calls `setTitle` — a plain async continuation with no abort-on-unmount,
  // so it still runs, and still enqueues its `upsertThread` write, after
  // the user has already navigated away (verification.md finding 2's exact
  // scenario). The title route is held open on an explicit gate that this
  // test itself releases, once it has navigated away AND installed the
  // write-failure patch — not a fixed delay racing those two steps. A fixed
  // 1500ms delay can't guarantee either side of that race: too short, and
  // the title response (and so `setTitle`'s write) could resolve before the
  // patch is installed, landing on a real write instead of a failing one;
  // too long, and the test is just slow without buying any more certainty.
  let releaseTitleResponse: () => void = () => {};
  const titleResponseGate = new Promise<void>((resolve) => {
    releaseTitleResponse = resolve;
  });
  await page.route("**/api/chat/completion", async (route) => {
    const body = route.request().postDataJSON() as { stream?: boolean } | null;
    if (body?.stream === false) {
      await titleResponseGate;
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(TITLE_RESPONSE) });
    }
    return route.fulfill({ status: 200, contentType: "text/event-stream", body: toSseBody() });
  });

  const composer = await openThread(page);
  await composer.fill(USER_TEXT);
  await composer.press("Enter");
  await expect(page.getByText(FIXTURE_FINAL_TEXT).first()).toBeVisible();

  // Navigate away while the title response is still held on the gate, then
  // patch writes to fail, THEN release the gate — `setTitle`'s write is
  // what should fail, off this thread's own page. Uses the app's own
  // client-side router (a real nav link click), NOT `page.goto()`:
  // `page.goto()` is a full browser navigation that tears down and reloads
  // the whole JS realm, destroying the in-flight
  // `afterStreamComplete`/title-generation continuation this test depends
  // on surviving — exactly the kind of accidental reset a real user's
  // in-app click would never cause.
  const nav = page.getByRole("navigation", { name: "Main" });
  await nav.getByRole("link", { name: "Agents", exact: true }).click();
  await expect(page.getByText("Research Analyst")).toBeVisible();
  await patchPutAbortsWrites(page);
  // Only now does the title route's fulfillment (and so `setTitle`'s write)
  // proceed — guaranteed to run against the now-failing writes, not racing
  // them.
  releaseTitleResponse();

  await expect(page.getByText(PERSISTENCE_FAILURE_TEXT)).toBeVisible();
  await expect(page).toHaveURL(/\/agents$/);
});

test("One tab's journal is left untouched by another tab's startup replay", async ({ page, context }) => {
  const composer = await openThread(page);
  await holdWritesPending(page);

  await composer.fill(USER_TEXT);
  await composer.press("Enter");
  await expect(page.getByText(FIXTURE_FINAL_TEXT).first()).toBeVisible();
  await expect(page.locator("[data-persistence]")).toHaveAttribute("data-persistence", "saving");

  const tabId = await page.evaluate((k) => sessionStorage.getItem(k), TAB_ID_STORAGE_KEY);
  expect(tabId).toBeTruthy();
  const journalKey = `${JOURNAL_KEY_PREFIX}:${tabId}`;

  // Write this tab's journal for real (pagehide/visibilitychange path), and
  // — crucially — leave this page OPEN (never navigate or close it), so its
  // page-lifetime Web Lock on `journalKey` stays held.
  await page.evaluate(() => {
    Object.defineProperty(document, "visibilityState", { configurable: true, get: () => "hidden" });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  const journalBefore = await page.evaluate((k) => localStorage.getItem(k), journalKey);
  expect(journalBefore).not.toBeNull();

  // A second, independent tab in the SAME context boots the app fresh.
  // Opening it backgrounds this page for real, which is itself further
  // (incidental) evidence the journal path works — but what this test
  // asserts is what happens to tab A's key once tab B's own `DbProvider`
  // boot (and its `replayJournal`) has fully completed.
  const tabB = await context.newPage();
  await installUarMock(tabB);
  await tabB.goto(`/threads/${FIXTURE_THREAD_ID}`);
  const composerB = tabB.getByPlaceholder(/Ask your agent anything/i).filter({ visible: true });
  await expect(composerB).toBeVisible();
  await tabB.waitForLoadState("networkidle");

  // Tab A's own key must be untouched: still present, with the SAME
  // content — proving tab B's replay (which does try every OTHER tab's
  // journal key with `ifAvailable: true`) found tab A's Web Locks lock
  // held and left it strictly alone, rather than clearing or replaying it
  // out from under a still-live tab.
  const journalAfterBBoots = await page.evaluate((k) => localStorage.getItem(k), journalKey);
  expect(journalAfterBBoots).toBe(journalBefore);

  // And tab A's own save state is unaffected by tab B's boot.
  await expect(page.locator("[data-persistence]")).toHaveAttribute("data-persistence", "saving");

  await tabB.close();
});
