/**
 * Visual-first captures for the render registry and the app A2UI surface
 * renderer (agui-render-registry 1.9, app-a2ui-surface-renderer 1.8). One mocked
 * turn carries an `a2ui` artifact (Card, Column, Text, Divider, TextField,
 * disabled Button) and an internal `provider_event` artifact that must stay
 * hidden. The PNGs land in test-results/a2ui-captures; look at them.
 */
import { expect, test } from "./support/test";
import { seedTheme } from "./support/page-helpers";
import { FIXTURE_THREAD_ID, THEMES } from "./support/routes";
import { TITLE_RESPONSE, toSseBody, type SseEvent } from "./fixtures/sse";

const rid = "req-a2ui-captures";
const SURFACE = "capture-card";

const A2UI_CONTENT = [
  {
    version: "v0.9.1",
    createSurface: { surfaceId: SURFACE, catalogId: "urn:uar:a2ui:catalog:1" },
  },
  {
    version: "v0.9.1",
    updateComponents: {
      surfaceId: SURFACE,
      components: [
        { id: "root", component: "Card", child: "body" },
        { id: "body", component: "Column", children: ["title", "rule", "answer", "name", "go"] },
        { id: "title", component: "Text", variant: "h3", text: "The Boss" },
        { id: "rule", component: "Divider" },
        {
          id: "answer",
          component: "Text",
          variant: "body",
          text: "An AI desktop workspace for developers and technical operators, with multi-provider conversations and agent sessions.",
        },
        { id: "name", component: "TextField", label: "Your name", value: { path: "/name" } },
        { id: "go", component: "Button", child: "goLabel", action: { event: { name: "continue", context: {} } } },
        { id: "goLabel", component: "Text", text: "Continue" },
      ],
    },
  },
  { version: "v0.9.1", updateDataModel: { surfaceId: SURFACE, path: "/name", value: "" } },
]
  .map((m) => JSON.stringify(m))
  .join("\n");

const EVENTS: SseEvent[] = [
  { event: "agui.stream.start", data: { kind: "stream", phase: "start", request_id: rid } },
  {
    event: "agui.artifact",
    data: {
      kind: "artifact",
      phase: "complete",
      request_id: rid,
      artifact_id: "art-internal",
      artifact_type: "provider_event",
      title: "provider_event",
      content: '{"secret":"internal-provider-detail"}',
    },
  },
  {
    event: "agui.artifact",
    data: {
      kind: "artifact",
      phase: "complete",
      request_id: rid,
      artifact_id: "art-card",
      artifact_type: "a2ui",
      title: "Answer",
      content: A2UI_CONTENT,
    },
  },
  {
    event: "agui.message.delta",
    data: { kind: "message", phase: "delta", request_id: rid, delta: { text: "Here is the summary." } },
  },
  { event: "agui.done", data: { kind: "done", request_id: rid } },
];

for (const theme of THEMES) {
  for (const width of [320, 1440] as const) {
    test(`A2UI surface and hidden diagnostics at ${width}px in the ${theme} theme`, async ({ page }) => {
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
      const composer = page.getByPlaceholder(/Ask your agent anything/i).filter({ visible: true });
      await composer.fill("What is The Boss?");
      await composer.press("Enter");

      const surface = page.getByTestId("a2ui-surface");
      await expect(surface).toBeVisible();
      await expect(surface.getByRole("heading", { name: "The Boss" })).toBeVisible();
      // App build: the nine components render, and a Button with an action is disabled.
      const field = surface.getByLabel("Your name");
      await expect(field).toBeVisible();
      // Flat 2.0 has no borders: the field is visible only if its fill differs from the card's.
      const [fieldFill, cardFill] = await Promise.all([
        field.evaluate((el) => getComputedStyle(el).backgroundColor),
        surface.locator("div.bg-muted-surface").first().evaluate((el) => getComputedStyle(el).backgroundColor),
      ]);
      // Composite the (possibly translucent) field fill over the card in a canvas, the way the eye sees it.
      const distance = await page.evaluate(
        ([card, fieldColor]) => {
          const ctx = document.createElement("canvas").getContext("2d", { willReadFrequently: true }) as CanvasRenderingContext2D;
          ctx.canvas.width = ctx.canvas.height = 1;
          const paint = (...fills: string[]) => {
            ctx.clearRect(0, 0, 1, 1);
            for (const fill of fills) {
              ctx.fillStyle = fill;
              ctx.fillRect(0, 0, 1, 1);
            }
            return Array.from(ctx.getImageData(0, 0, 1, 1).data).slice(0, 3);
          };
          const [cardPx, fieldPx] = [paint(card), paint(card, fieldColor)];
          return cardPx.reduce((sum, c, i) => sum + Math.abs(c - (fieldPx[i] ?? 0)), 0);
        },
        [cardFill, fieldFill],
      );
      expect(distance, `field fill ${fieldFill} over card ${cardFill}: too close to see`).toBeGreaterThanOrEqual(24);
      await expect(surface.getByRole("button", { name: "Continue" })).toBeDisabled();
      // The internal artifact never reaches the page.
      await expect(page.locator("body")).not.toContainText("internal-provider-detail");
      await expect(page.locator("body")).not.toContainText("provider_event");

      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow, "horizontal overflow").toBeLessThanOrEqual(0);

      await surface.evaluate((el) => el.scrollIntoView({ block: "center" }));
      await page.screenshot({ path: `test-results/a2ui-captures/surface-${width}-${theme}.png` });
    });
  }
}

// agui-inferred-a2ui 1.5: a persisted `confirm` artifact has no template, so the
// client infers a read-only card from its JSON.
const INFERRED_EVENTS: SseEvent[] = [
  { event: "agui.stream.start", data: { kind: "stream", phase: "start", request_id: rid } },
  {
    event: "agui.artifact",
    data: {
      kind: "artifact",
      phase: "complete",
      request_id: rid,
      artifact_id: "art-confirm",
      artifact_type: "confirm",
      title: "Calendar",
      content: JSON.stringify({
        message: "Add the roadmap review to your calendar?",
        accept_label: "Add",
        cancel_label: "Skip",
      }),
    },
  },
  { event: "agui.done", data: { kind: "done", request_id: rid } },
];

for (const theme of THEMES) {
  for (const width of [320, 1440] as const) {
    test(`Inferred card at ${width}px in the ${theme} theme`, async ({ page }) => {
      await seedTheme(page, theme);
      await page.setViewportSize({ width, height: 900 });
      await page.route("**/api/chat/completion", async (route) => {
        const body = route.request().postDataJSON() as { stream?: boolean } | null;
        if (body?.stream === false) {
          return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(TITLE_RESPONSE) });
        }
        return route.fulfill({ status: 200, contentType: "text/event-stream", body: toSseBody(INFERRED_EVENTS) });
      });
      await page.goto(`/threads/${FIXTURE_THREAD_ID}`);
      const composer = page.getByPlaceholder(/Ask your agent anything/i).filter({ visible: true });
      await composer.fill("Put the review on my calendar.");
      await composer.press("Enter");

      const surface = page.getByTestId("a2ui-surface");
      await expect(surface).toBeVisible();
      await expect(surface).toContainText("Add the roadmap review to your calendar?");
      // Inference never generates a control.
      await expect(surface.locator("button, input, select, textarea, a[href]")).toHaveCount(0);

      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow, "horizontal overflow").toBeLessThanOrEqual(0);

      await surface.evaluate((el) => el.scrollIntoView({ block: "center" }));
      await page.screenshot({ path: `test-results/a2ui-captures/inferred-${width}-${theme}.png` });
    });
  }
}
