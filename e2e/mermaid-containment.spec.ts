/**
 * An invalid ```mermaid fence must fall back inside the chat column: Mermaid's
 * own "Syntax error" SVG is never appended to document.body.
 *
 *   npx playwright test e2e/mermaid-containment.spec.ts --project=chromium
 *
 * Set MERMAID_CAPTURE_DIR to also write 320 and 1440 px screenshots per theme.
 */
import path from "node:path";
import { expect, test } from "./support/test";
import { seedTheme } from "./support/page-helpers";
import { FIXTURE_THREAD_ID, THEMES, waitForAppReady } from "./support/routes";
import { TITLE_RESPONSE, toSseBody, type SseEvent } from "./fixtures/sse";

const rid = "req-mermaid-containment-e2e";
const INVALID = "graph LR\n  A --> \n  B -->> ((( C";
const REPLY = `A broken diagram follows.\n\n\`\`\`mermaid\n${INVALID}\n\`\`\`\n\nThat is the end.`;

const EVENTS: SseEvent[] = [
  { event: "agui.stream.start", data: { kind: "stream", phase: "start", request_id: rid } },
  { event: "agui.message.delta", data: { kind: "message", phase: "delta", request_id: rid, delta: { text: REPLY } } },
  { event: "agui.done", data: { kind: "done", request_id: rid } },
];

for (const theme of THEMES) {
  for (const width of [320, 1440]) {
    test(`invalid mermaid falls back in the column with no body-level error svg (${width}px, ${theme})`, async ({ page }) => {
      await seedTheme(page, theme);
      await page.setViewportSize({ width, height: 900 });
      await page.route("**/api/chat/completion", async (route) => {
        const body = route.request().postDataJSON() as { stream?: boolean } | null;
        if (body?.stream === false) {
          return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(TITLE_RESPONSE) });
        }
        return route.fulfill({ status: 200, contentType: "text/event-stream", body: toSseBody(EVENTS) });
      });
      await page.goto(`/threads/${FIXTURE_THREAD_ID}`);
      await waitForAppReady(page);
      const composer = page.getByLabel("Message input").filter({ visible: true });
      await composer.fill("Draw it.");
      await composer.press("Enter");

      await expect(page.getByText("That is the end.").first()).toBeAttached();
      await expect(page.getByText("Diagram could not be rendered")).toBeVisible();

      const strays = await page.evaluate(() =>
        Array.from(document.body.children)
          .filter((el) => el.tagName.toLowerCase() === "svg" || /^d?mermaid-/.test(el.id))
          .map((el) => el.outerHTML.slice(0, 120)),
      );
      expect(strays, "mermaid nodes appended to document.body").toEqual([]);
      expect(await page.evaluate(() => document.body.textContent?.includes("mermaid version"))).toBe(false);

      const dir = process.env.MERMAID_CAPTURE_DIR;
      if (dir) await page.screenshot({ path: path.join(dir, `mermaid-invalid__${width}__${theme}.png`) });
    });
  }
}
