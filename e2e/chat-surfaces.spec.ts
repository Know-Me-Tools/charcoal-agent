/**
 * chat-surfaces-flat2 spec (docs/design/chat-surfaces.md): user-message
 * contrast computed from rendered styles, no horizontal document scroll at
 * 320px with a long unbroken tool name fully visible, A2UI "Response
 * captured" gating, the Mermaid artifact rendering by default, and the
 * composer's focus treatment (fill change, no border, no outline).
 */
import { expect, test } from "./support/test";
import { openRoute, seedTheme } from "./support/page-helpers";
import { APP_ROUTES, FIXTURE_THREAD_ID, THEMES } from "./support/routes";
import { LONG_TOOL_NAME } from "./fixtures/sse";
import { contrastRatio } from "./support/contrast";

const THREAD_ROUTE = APP_ROUTES.find((r) => r.name === "thread")!;
const AA_NORMAL_TEXT = 4.5;

for (const theme of THEMES) {
  test(`user message text reaches ${AA_NORMAL_TEXT}:1 against its own fill in ${theme}`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await seedTheme(page, theme);
    await openRoute(page, THREAD_ROUTE);

    // Resolve the actual rendered colours (not class names): the bubble's
    // computed background, and the computed colour of the innermost element
    // that carries the visible text, since a markdown wrapper could in
    // principle override `color` between the bubble and the glyphs.
    const { bg, fg } = await page.evaluate(() => {
      const bubble = document.querySelector<HTMLElement>('[data-role="user"] .bg-ember-soft');
      if (!bubble) throw new Error("user message bubble not found");
      const deepestWithText = (el: HTMLElement): HTMLElement => {
        for (const child of Array.from(el.children)) {
          if (child instanceof HTMLElement && (child.textContent ?? "").trim()) {
            return deepestWithText(child);
          }
        }
        return el;
      };
      const textEl = deepestWithText(bubble);
      return {
        bg: getComputedStyle(bubble).backgroundColor,
        fg: getComputedStyle(textEl).color,
      };
    });

    expect(contrastRatio(fg, bg)).toBeGreaterThanOrEqual(AA_NORMAL_TEXT);
  });
}

test("320px: no horizontal document scroll with every block shown, and the long tool name is fully visible with no ellipsis", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await openRoute(page, THREAD_ROUTE);
  const toolName = page.getByText(LONG_TOOL_NAME).first();
  await expect(toolName).toBeAttached();

  const documentOverflow = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(documentOverflow.scrollWidth).toBeLessThanOrEqual(documentOverflow.clientWidth);

  // The document itself never scrolls horizontally even pre-change (the
  // thread viewport clips it), so the real regression the design fixes only
  // shows up one level in: the scrollable thread viewport must not need to
  // scroll horizontally either, or the long name is being clipped/scrolled
  // rather than wrapped.
  const viewportOverflow = await page.locator(".aui-thread-viewport").evaluate((el) => ({
    scrollWidth: el.scrollWidth,
    clientWidth: el.clientWidth,
  }));
  expect(viewportOverflow.scrollWidth).toBeLessThanOrEqual(viewportOverflow.clientWidth);

  const nameOverflow = await toolName.evaluate((el) => ({
    scrollWidth: el.scrollWidth,
    clientWidth: el.clientWidth,
    textOverflow: getComputedStyle(el).textOverflow,
  }));
  expect(nameOverflow.scrollWidth).toBeLessThanOrEqual(nameOverflow.clientWidth);
  expect(nameOverflow.textOverflow).not.toBe("ellipsis");
});

test('A2UI: "Response captured" is absent before a response and appears after submitting one', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openRoute(page, THREAD_ROUTE);

  await expect(page.getByText(/response captured/i)).toHaveCount(0);
  // The fixture's artifact_input_request is a "confirm" type with accept
  // label "Add" (e2e/fixtures/sse.ts); the UAR mock already answers the
  // artifact-response endpoint with { ok: true }.
  await page.getByRole("button", { name: "Add", exact: true }).click();
  await expect(page.getByText(/response captured/i)).toBeVisible();
});

test('Mermaid: the "Week flow" artifact card renders an svg by default, with no click', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openRoute(page, THREAD_ROUTE);

  const title = page.getByText("Week flow", { exact: true });
  await expect(title).toBeAttached();
  const card = title.locator("xpath=..");
  await expect(card.locator("svg[id^=mermaid]")).toBeVisible();
});

test("composer: focus changes the fill and adds no border or outline to the container", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`/threads/${FIXTURE_THREAD_ID}`);
  const footer = page.locator(".aui-thread-viewport-footer");
  const input = footer.getByPlaceholder(/Ask your agent anything/i).filter({ visible: true });
  await expect(input).toBeVisible();
  // `ComposerPrimitive.Input` renders a bare `<textarea>` (react-textarea-autosize),
  // so its immediate DOM parent is the dropzone div that owns the
  // `focus-within` fill (`EnhancedComposer`'s `AttachmentDropzone`). Selecting
  // via the input's own accessible name/placeholder avoids depending on
  // whichever colour/token class that container happens to use.
  const container = input.locator("xpath=..");
  await expect(container).toBeVisible();

  // The composer input autofocuses on mount (`autoFocus` in
  // `EnhancedComposer`), so the true at-rest state has to be captured after
  // deliberately moving focus away first.
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
  const restBg = await container.evaluate((el) => getComputedStyle(el).backgroundColor);
  await input.focus();
  const focused = await container.evaluate((el) => {
    const s = getComputedStyle(el);
    return {
      bg: s.backgroundColor,
      borderWidths: [s.borderTopWidth, s.borderRightWidth, s.borderBottomWidth, s.borderLeftWidth],
      outlineStyle: s.outlineStyle,
      outlineWidth: s.outlineWidth,
    };
  });

  expect(focused.bg).not.toBe(restBg);
  expect(focused.borderWidths.every((w) => parseFloat(w) === 0)).toBe(true);
  expect(focused.outlineStyle === "none" || parseFloat(focused.outlineWidth) === 0).toBe(true);
});
