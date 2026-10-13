/**
 * Reply image policy in a real browser (site-reply-content-hardening 3.1/3.2,
 * `src/lib/link-policy/reply-content-policy.ts`): an image in an agent reply
 * loads only from the site's own hosts or a same-origin path. A remote image
 * renders as its alt text and the browser never requests it, because a remote
 * image would fire a request (a tracking pixel) the moment it rendered.
 */
import { expect, test } from "./support/test";
import { FIXTURE_THREAD_ID } from "./support/routes";
import {
  REMOTE_IMAGE_ALT,
  REMOTE_IMAGE_HOST,
  REMOTE_IMAGE_REPLY_TEXT,
  REMOTE_IMAGE_STREAM_EVENTS,
  TITLE_RESPONSE,
  toSseBody,
} from "./fixtures/sse";

test("a remote image in a reply renders its alt text, no <img>, and no request for it", async ({ page }) => {
  const remoteRequests: string[] = [];
  page.on("request", (req) => {
    if (new URL(req.url()).hostname === REMOTE_IMAGE_HOST) remoteRequests.push(req.url());
  });

  await page.route("**/api/chat/completion", async (route) => {
    const body = route.request().postDataJSON() as { stream?: boolean } | null;
    if (body?.stream === false) {
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(TITLE_RESPONSE) });
    }
    return route.fulfill({
      status: 200,
      contentType: "text/event-stream",
      body: toSseBody(REMOTE_IMAGE_STREAM_EVENTS),
    });
  });

  await page.goto(`/threads/${FIXTURE_THREAD_ID}`);
  const composer = page.getByPlaceholder(/Ask your agent anything/i).filter({ visible: true });
  await expect(composer).toBeVisible();
  await composer.fill("Show me the picture.");
  await composer.press("Enter");

  await expect(page.getByText(REMOTE_IMAGE_REPLY_TEXT).first()).toBeVisible();
  // The alt text takes the image's place.
  await expect(page.getByText(REMOTE_IMAGE_ALT).first()).toBeVisible();
  await expect(page.locator(`img[alt="${REMOTE_IMAGE_ALT}"]`)).toHaveCount(0);
  await expect(page.locator(`img[src*="${REMOTE_IMAGE_HOST}"]`)).toHaveCount(0);

  // Let any request an <img> would have fired surface before asserting none was made.
  await page.waitForLoadState("networkidle");
  expect(remoteRequests).toEqual([]);
});
