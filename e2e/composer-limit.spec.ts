/**
 * site-composer-limit: the site chat takes at most 4,000 characters a message.
 * The composer counts from 3,200, turns to an over-limit state and stops the
 * send past 4,000, has no dead "+" attach button, and a 413 from the server
 * (mock stream) shows a plain notice with no "Try again" and leaves the text in
 * the box. Site build only (VITE_SITE_AGENT_ID=knowme-site). Only the UAR
 * backend is the suite's mock; this spec stubs the chat request itself.
 */
import { randomUUID } from "node:crypto";
import { expect, test } from "./support/test";
import { TITLE_RESPONSE } from "./fixtures/sse";
import { COMPOSER_LIMIT_CONTENT } from "../content/site/composer-limit";

test.skip(!process.env.VITE_SITE_AGENT_ID, "site build only: run with VITE_SITE_AGENT_ID=knowme-site");

const c = COMPOSER_LIMIT_CONTENT;
const MESSAGE_ERROR = "The reply stopped before it finished.";

test("the counter, the over-limit state and the stopped send", async ({ page }) => {
  let chatRequests = 0;
  await page.route("**/api/chat/completion", async (route) => {
    const body = route.request().postDataJSON() as Record<string, unknown> | null;
    if (body?.stream === false) {
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(TITLE_RESPONSE) });
    }
    chatRequests += 1;
    return route.fulfill({ status: 500, contentType: "application/json", body: "{}" });
  });

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`/threads/${randomUUID()}`);
  const input = page.getByLabel("Message input").filter({ visible: true });
  await expect(input).toBeVisible();
  const counter = page.getByRole("group", { name: c.counterLabel });

  // The "+" attach button does nothing on the site, so it is not there.
  await expect(page.getByRole("button", { name: /add attachment/i })).toHaveCount(0);

  await input.fill("a".repeat(3199));
  await expect(counter).toHaveCount(0);

  await input.fill("a".repeat(3300));
  await expect(counter).toHaveAttribute("data-state", "near");
  await expect(counter).toContainText(c.remaining(700));
  await expect(counter).toContainText(c.hint);

  await input.fill("a".repeat(4100));
  await expect(counter).toHaveAttribute("data-state", "over");
  await expect(counter).toContainText(c.over(100));
  const send = page.getByRole("button", { name: "Send message" });
  await expect(send).toBeDisabled();

  // Enter must not slip past the disabled button.
  await input.press("Enter");
  await page.waitForTimeout(300);
  expect(chatRequests).toBe(0);
  await expect(input).toHaveValue("a".repeat(4100));

  // Back under the limit, the send is allowed again.
  await input.fill("a".repeat(4000));
  await expect(counter).toHaveAttribute("data-state", "warn");
  await expect(send).toBeEnabled();

  // No horizontal overflow from the counter row.
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});

test("a 413 shows the plain notice, no Try again, and keeps the text in the box", async ({ page }) => {
  const text = "b".repeat(3900);
  let chatRequests = 0;
  await page.route("**/api/chat/completion", async (route) => {
    const body = route.request().postDataJSON() as Record<string, unknown> | null;
    if (body?.stream === false) {
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(TITLE_RESPONSE) });
    }
    chatRequests += 1;
    return route.fulfill({
      status: 413,
      contentType: "application/json",
      body: JSON.stringify({ error: "payload_too_large", message: "`message` is longer than 4000 characters" }),
    });
  });

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`/threads/${randomUUID()}`);
  const input = page.getByLabel("Message input").filter({ visible: true });
  await input.fill(text);
  await input.press("Enter");

  await expect(page.getByText(c.tooLongNotice.heading)).toBeVisible();
  await expect(page.getByText(c.tooLongNotice.body)).toBeVisible();
  expect(chatRequests).toBe(1);

  // Not the generic failure, and nothing to retry.
  await expect(page.getByText(MESSAGE_ERROR)).toHaveCount(0);
  await expect(page.getByRole("button", { name: /try again/i })).toHaveCount(0);
  // The refused message is not left in the conversation, and the draft is back.
  await expect(page.locator('[data-role="user"]')).toHaveCount(0);
  await expect(input).toHaveValue(text);
});
