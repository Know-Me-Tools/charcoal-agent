/**
 * site-web-search 16.8.4 (mock stream): the composer's "Search the web"
 * toggle, a web turn with a Sources item, and the unresolved-marker rule.
 *
 * The toggle exists only on the site build (`VITE_SITE_AGENT_ID` set when the
 * dev server starts), so this spec skips on the default app build. Run it with
 *   VITE_SITE_AGENT_ID=knowme-site npx playwright test e2e/web-search.spec.ts
 * No golden is captured here; screenshots of the Sources block at 320 and
 * 1440 in both themes stay a reviewed manual step.
 */
import { expect, test } from "./support/test";
import { FIXTURE_THREAD_ID } from "./support/routes";
import { TITLE_RESPONSE, toSseBody, type SseEvent } from "./fixtures/sse";

test.skip(!process.env.VITE_SITE_AGENT_ID, "The web-search toggle exists only on the site build (set VITE_SITE_AGENT_ID).");

const TOGGLE_NAME = /Search the web/;
const WEB_HOST = "example.org";
const WEB_URL = "https://example.org/rust-1-9";
const WEB_TITLE = "Rust 1.9 released";
const REPLY = "Rust 1.9 is the latest stable release [W1]. A second claim has no source [W4].";
const rid = "req-web-search-e2e";

const KB_REPLY = "KnowMe builds agents.";
const kbEvents: SseEvent[] = [
  { event: "agui.stream.start", data: { kind: "stream", phase: "start", request_id: rid } },
  { event: "agui.message.delta", data: { kind: "message", phase: "delta", request_id: rid, delta: { text: KB_REPLY } } },
  { event: "agui.done", data: { kind: "done", request_id: rid } },
];

const webEvents: SseEvent[] = [
  { event: "agui.stream.start", data: { kind: "stream", phase: "start", request_id: rid } },
  { event: "agui.step", data: { kind: "step", phase: "started", index: 0, label: "Searching the web" } },
  { event: "agui.step", data: { kind: "step", phase: "finished", index: 0, label: "Searching the web" } },
  {
    event: "agui.web_citations",
    data: {
      kind: "web_citations",
      phase: "added",
      citations: [
        { origin: "web", marker: 1, title: WEB_TITLE, host: WEB_HOST, url: WEB_URL, snippet: "The latest stable release." },
      ],
    },
  },
  { event: "agui.message.delta", data: { kind: "message", phase: "delta", request_id: rid, delta: { text: REPLY } } },
  { event: "agui.done", data: { kind: "done", request_id: rid } },
];

test("the toggle is off by default, sends web_search only when on, and a web turn shows its source", async ({ page }) => {
  const streamBodies: Array<Record<string, unknown>> = [];

  await page.route("**/api/chat/completion", async (route) => {
    const body = route.request().postDataJSON() as Record<string, unknown> | null;
    if (body?.stream === false) {
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(TITLE_RESPONSE) });
    }
    streamBodies.push(body ?? {});
    return route.fulfill({
      status: 200,
      contentType: "text/event-stream",
      body: toSseBody(body?.web_search === true ? webEvents : kbEvents),
    });
  });

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`/threads/${FIXTURE_THREAD_ID}`);
  const composer = page.getByLabel("Message input").filter({ visible: true });
  await expect(composer).toBeVisible();

  // Off by default, with the privacy note reachable as the description.
  const toggle = page.getByRole("button", { name: TOGGLE_NAME });
  await expect(toggle).toHaveAttribute("aria-pressed", "false");
  await expect(toggle).toHaveAccessibleDescription(/third-party search service/i);

  await composer.fill("What is KnowMe?");
  await composer.press("Enter");
  await expect(page.getByText(KB_REPLY).first()).toBeVisible();
  expect(streamBodies).toHaveLength(1);
  expect("web_search" in streamBodies[0]).toBe(false);

  // Keyboard: focus the toggle and press Space.
  await toggle.focus();
  await page.keyboard.press("Space");
  await expect(toggle).toHaveAttribute("aria-pressed", "true");

  await composer.fill("What changed in the latest Rust release?");
  await composer.press("Enter");
  await expect(page.getByText("Rust 1.9 is the latest stable release").first()).toBeVisible();
  expect(streamBodies).toHaveLength(2);
  expect(streamBodies[1].web_search).toBe(true);
  // The first request was sent before the toggle was on and is not rewritten.
  expect("web_search" in streamBodies[0]).toBe(false);

  // The step row, then the Sources item: Web label, marker, title, host, URL as text.
  await expect(page.getByText("Searching the web").first()).toBeVisible();
  const sources = page.getByTestId("citation-sources").last();
  await expect(sources).toBeVisible();
  await expect(sources).toContainText("Web");
  await expect(sources).toContainText("[W1]");
  await expect(sources).toContainText(WEB_TITLE);
  await expect(sources).toContainText(WEB_HOST);
  await expect(sources).toContainText(WEB_URL);
  await expect(sources.locator("a")).toHaveCount(0);

  // [W1] resolves in the reply; the unmatched [W4] stays plain text.
  const reply = page.locator('[data-role="assistant"]').last();
  await expect(reply.locator('[data-web-marker="1"]')).toHaveCount(1);
  await expect(reply.locator('[data-web-marker="4"]')).toHaveCount(0);
  await expect(reply).toContainText("[W4]");

  // No horizontal overflow from the host and URL lines.
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);

  // The choice is kept for the next visit.
  await page.reload();
  await expect(page.getByRole("button", { name: TOGGLE_NAME })).toHaveAttribute("aria-pressed", "true");
});

test("below 768 the toggle is a 44 px target and the page does not scroll sideways", async ({ page }) => {
  await page.route("**/api/chat/completion", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(TITLE_RESPONSE) }),
  );
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto(`/threads/${FIXTURE_THREAD_ID}`);
  const toggle = page.getByRole("button", { name: TOGGLE_NAME });
  await expect(toggle).toBeVisible();
  const box = await toggle.boundingBox();
  expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
  const before = box?.width ?? 0;
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-pressed", "true");
  expect((await toggle.boundingBox())?.width).toBeCloseTo(before, 0);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});
