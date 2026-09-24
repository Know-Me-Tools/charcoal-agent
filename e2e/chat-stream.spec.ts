/**
 * chat-stream-rendering spec: every block type is shown, including those
 * that precede the first token, and a finished conversation reloads from
 * local storage without contacting the runtime.
 */
import { expect, test } from "./support/test";
import { APP_ROUTES } from "./support/routes";
import { FIXTURE_FINAL_TEXT } from "./fixtures/sse";

const BLOCK_MARKERS = [
  "KnowMe Profile", // skill activation (before first token)
  "summarize_oldest", // context update (before first token)
  "work.focus", // memory recall (before first token)
  "calendar_list_events", // tool call
  "Planning guide", // citation
  "Prefers weekly plans on Monday mornings", // memory mutation
  "Week flow", // artifact
  "Add Thursday review to calendar?", // artifact input request
  "Custom Event", // A2UI display
  FIXTURE_FINAL_TEXT, // text
];

test("a streamed reply shows every block and reloads from local storage", async ({ page }) => {
  const thread = APP_ROUTES.find((r) => r.name === "thread")!;
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(thread.path);
  await thread.prepare!(page);
  for (const marker of BLOCK_MARKERS) {
    await expect(page.getByText(marker).first(), marker).toBeAttached();
  }

  const chatRequests: string[] = [];
  page.on("request", (req) => {
    if (req.url().includes("/api/chat/completion")) chatRequests.push(req.url());
  });
  await page.reload();

  await expect(page.getByText("Plan my week around the rebrand launch.").first()).toBeAttached();
  for (const marker of BLOCK_MARKERS) {
    await expect(page.getByText(marker).first(), `after reload: ${marker}`).toBeAttached();
  }
  expect(chatRequests).toEqual([]);
});
