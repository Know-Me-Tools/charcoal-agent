/**
 * chat-surfaces-flat2 spec (docs/design/chat-surfaces.md, specs/chat-surfaces/spec.md):
 * user-message contrast computed from rendered styles, no horizontal document
 * scroll at 320px with a long unbroken tool name fully visible, A2UI
 * "Response captured" gating, the Mermaid artifact rendering by default, the
 * composer's focus treatment, a block-wide Flat 2.0 sweep, thinking expand,
 * all three tool states, the HTML artifact backdrop and full-screen dialog,
 * the streaming cyan indicator mid-stream, the plain-language message error,
 * and the Mermaid source/copy toggle.
 */
import { expect, test } from "./support/test";
import { openRoute, seedTheme } from "./support/page-helpers";
import { APP_ROUTES, FIXTURE_THREAD_ID, THEMES } from "./support/routes";
import {
  ERROR_STREAM_EVENTS,
  FAILED_TOOL_NAME,
  FIXTURE_FINAL_TEXT,
  FIXTURE_IMAGE_ALT,
  HTML_ARTIFACT_LABEL,
  LONG_TOOL_NAME,
  PARTIAL_STREAM_EVENTS,
  PARTIAL_STREAM_THINKING_ONLY_EVENTS,
  RAW_STREAM_ERROR_TEXT,
  RUNNING_TOOL_NAME,
  TITLE_RESPONSE,
  toSseBody,
} from "./fixtures/sse";
import { contrastRatio } from "./support/contrast";
import { holdChatStreamOpen } from "./support/uar-mock";

const THREAD_ROUTE = APP_ROUTES.find((r) => r.name === "thread")!;
const AA_NORMAL_TEXT = 4.5;

/**
 * Mirrors `MESSAGE_ERROR_TEXT` in `src/components/assistant-ui/enhanced-thread.tsx`.
 * Not imported directly: that module transitively pulls in a `.css` import
 * (via `enhanced-markdown-text.tsx` → katex), which Playwright's Node-side
 * spec loader cannot resolve outside a browser/Vite context.
 */
const MESSAGE_ERROR_TEXT = "The reply stopped before it finished.";

/** Reads a KnowMe token's actual rendered colour on the current page. */
async function tokenColor(
  page: import("@playwright/test").Page,
  name: string,
  prop: "backgroundColor" | "color" = "backgroundColor",
): Promise<string> {
  return page.evaluate(
    ({ varName, cssProp }) => {
      const probe = document.createElement("div");
      probe.style[cssProp as "backgroundColor" | "color"] = `var(${varName})`;
      document.body.append(probe);
      const value = getComputedStyle(probe)[cssProp as "backgroundColor" | "color"];
      probe.remove();
      return value;
    },
    { varName: name, cssProp: prop },
  );
}

/** The rendered right edge of a locator's bounding box, in viewport px. */
async function rightEdge(locator: import("@playwright/test").Locator): Promise<number> {
  const box = await locator.boundingBox();
  if (!box) throw new Error("locator has no bounding box");
  return box.x + box.width;
}

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

// ─── User message trailing edge and fill token (spec scenarios 4, 5) ──────────

for (const theme of THEMES) {
  test(`User message: sits at the trailing edge and its fill matches km-ember-soft in ${theme}`, async ({ page }) => {
    // At 320px the avatar (`@md:flex`, hidden below the container's 448px
    // breakpoint) is not shown, so the ember-soft bubble is the last item in
    // its `justify-end` row and its right edge should equal the message
    // root's right edge — the root itself is the `mx-auto max-w-(--thread-max-width)`
    // "thread column" element (`px-0` at this width, so no inner padding is
    // in the way). At wider widths the avatar sits to the bubble's right, so
    // this alignment is only meaningful without it.
    await page.setViewportSize({ width: 320, height: 800 });
    await seedTheme(page, theme);
    await openRoute(page, THREAD_ROUTE);

    const messageRoot = page.locator('[data-role="user"]').first();
    const bubble = messageRoot.locator(".bg-ember-soft").first();
    await expect(bubble).toBeVisible();

    const [rootRight, bubbleRight, bubbleBg, emberSoft] = await Promise.all([
      rightEdge(messageRoot),
      rightEdge(bubble),
      bubble.evaluate((el) => getComputedStyle(el).backgroundColor),
      tokenColor(page, "--km-ember-soft"),
    ]);

    expect(Math.abs(rootRight - bubbleRight)).toBeLessThanOrEqual(2);
    expect(bubbleBg).toBe(emberSoft);
  });
}

// ─── Assistant reply is authored prose (spec scenario 3) ───────────────────────

test("Assistant reply: no background fill, body (Roboto) font, and prose capped near 68ch", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openRoute(page, THREAD_ROUTE);

  const paragraph = page.getByText(FIXTURE_FINAL_TEXT, { exact: true });
  await expect(paragraph).toBeVisible();

  const info = await paragraph.evaluate((el) => {
    const s = getComputedStyle(el);
    return { bg: s.backgroundColor, fontFamily: s.fontFamily, maxWidth: s.maxWidth };
  });

  // No fill distinct from the canvas: the paragraph itself paints nothing.
  expect(info.bg).toBe("rgba(0, 0, 0, 0)");
  // Body face is Roboto (`--font-body: Roboto, sans-serif`, src/index.css).
  expect(info.fontFamily).toContain("Roboto");
  // `max-w-[68ch]` resolved by the browser to a px value that depends on the
  // element's own font metrics — probe a reference element in the same font
  // context rather than hand-computing a ch-to-px conversion.
  const expectedMaxWidth = await page.evaluate(
    ({ fontFamily }) => {
      const probe = document.createElement("div");
      probe.style.fontFamily = fontFamily;
      probe.style.fontSize = "15px"; // font-body text-[15px] (design doc §3.3)
      probe.style.maxWidth = "68ch";
      document.body.append(probe);
      const value = getComputedStyle(probe).maxWidth;
      probe.remove();
      return value;
    },
    { fontFamily: info.fontFamily },
  );
  expect(info.maxWidth).toBe(expectedMaxWidth);
});

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

  // "Every block type" (spec scenario 13) includes the image and divider
  // markdown blocks — neither should force the document wider than 320px.
  const image = page.locator(`img[alt="${FIXTURE_IMAGE_ALT}"]`);
  await expect(image).toBeAttached();
  const imageBox = await image.boundingBox();
  expect(imageBox?.x ?? 0).toBeGreaterThanOrEqual(0);
  expect((imageBox?.x ?? 0) + (imageBox?.width ?? 0)).toBeLessThanOrEqual(320);

  await expect(page.locator("hr").first()).toBeAttached();
});

test('A2UI: "Response captured" is absent before a response and appears after submitting one', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openRoute(page, THREAD_ROUTE);

  await expect(page.getByText(/response captured/i)).toHaveCount(0);
  // The fixture's artifact_input_request is a "confirm" type with accept
  // label "Add" (e2e/fixtures/sse.ts); the UAR mock already answers the
  // artifact-response endpoint with { ok: true }.
  await page.getByRole("button", { name: "Add", exact: true }).click();
  const captured = page.getByText(/response captured/i);
  await expect(captured).toBeVisible();

  // Scenario 16: the success tone, not just the text — the pill is
  // `bg-success-soft text-success-text` (a2ui-artifact-block.tsx).
  const capturedColor = await captured.evaluate((el) => getComputedStyle(el).color);
  expect(capturedColor).toBe(await tokenColor(page, "--km-success-text", "color"));
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
  const rest = await container.evaluate((el) => {
    const s = getComputedStyle(el);
    return { bg: s.backgroundColor, outlineStyle: s.outlineStyle, outlineWidth: s.outlineWidth };
  });
  // Scenario 6: no outline at rest (border-at-rest is already covered by the
  // block-wide sweep below).
  expect(rest.outlineStyle === "none" || parseFloat(rest.outlineWidth) === 0).toBe(true);

  await input.focus();
  const focused = await container.evaluate((el) => {
    const s = getComputedStyle(el);
    return {
      bg: s.backgroundColor,
      borderWidths: [s.borderTopWidth, s.borderRightWidth, s.borderBottomWidth, s.borderLeftWidth],
      outlineStyle: s.outlineStyle,
      outlineWidth: s.outlineWidth,
      boxShadow: s.boxShadow,
    };
  });

  expect(focused.bg).not.toBe(rest.bg);
  expect(focused.borderWidths.every((w) => parseFloat(w) === 0)).toBe(true);
  expect(focused.outlineStyle === "none" || parseFloat(focused.outlineWidth) === 0).toBe(true);
  // Scenario 7: no ring/box-shadow outline when focused — Tailwind `ring-*`
  // renders as `box-shadow`, which the block-wide sweep does not check here
  // because it always runs at rest (composer blurred first).
  expect(focused.boxShadow).toBe("none");
});

// ─── Block-wide Flat 2.0 sweep (spec scenarios 2, 6) ───────────────────────────

for (const theme of THEMES) {
  test(`Flat 2.0: no element in the thread region has a visible border, box shadow or backdrop filter, and no text is under 12px (${theme})`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await seedTheme(page, theme);
    await openRoute(page, THREAD_ROUTE);
    // The composer autofocuses on mount; check it at rest, per scenario 6.
    await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());

    const offenders = await page.evaluate(() => {
      const root = document.querySelector(".aui-thread-root");
      if (!root) return ["root not found: .aui-thread-root"];
      const found: string[] = [];
      for (const el of [root, ...Array.from(root.querySelectorAll("*"))]) {
        const s = getComputedStyle(el);
        const bordered = ["Top", "Right", "Bottom", "Left"].some(
          (side) =>
            parseFloat(s.getPropertyValue(`border-${side.toLowerCase()}-width`)) > 0 &&
            s.getPropertyValue(`border-${side.toLowerCase()}-color`) !== "rgba(0, 0, 0, 0)",
        );
        if (bordered) found.push(`border: ${el.tagName}.${(el as HTMLElement).className}`);
        if (s.boxShadow !== "none" && !el.matches(":focus-visible")) {
          found.push(`shadow: ${el.tagName}.${(el as HTMLElement).className}`);
        }
        if (s.backdropFilter !== "none" && s.backdropFilter !== "") found.push(`blur: ${el.tagName}`);
        const hasText = Array.from(el.childNodes).some((n) => n.nodeType === Node.TEXT_NODE && n.textContent?.trim());
        if (hasText && parseFloat(s.fontSize) < 12) found.push(`${s.fontSize}: ${el.textContent?.trim()}`);
      }
      return found;
    });

    // This sweep's first dark run caught a real, visible 1px border on the
    // composer's "Add Attachment" button (`src/components/assistant-ui/attachment.tsx`),
    // which the chat-surfaces-flat2 guard never scanned. Fixed in `a9dd0fe`
    // (Flat 2.0 attachment styling) and the guard glob now includes
    // `attachment.tsx` (`e4900d3`) — see docs/qa/chat-surfaces-flat2.md §6.4.
    // Left as a plain assertion so the sweep keeps catching a regression here.
    expect(offenders).toEqual([]);
  });
}

// ─── Thinking expand (spec scenario 8) ─────────────────────────────────────────

test("Thinking: collapsed by default, aria-expanded toggles, and the body shows on expand", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openRoute(page, THREAD_ROUTE);

  const trigger = page.getByRole("button", { name: "Reasoning" });
  await expect(trigger).toBeVisible();
  await expect(trigger).toHaveAttribute("aria-expanded", "false");

  const body = page.getByText("The user wants a weekly plan.");
  await expect(body).toBeHidden();

  await trigger.click();
  await expect(trigger).toHaveAttribute("aria-expanded", "true");
  await expect(body).toBeVisible();
});

test("Thinking and citation blocks: fill equals km-cyan-soft", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openRoute(page, THREAD_ROUTE);

  // Reasoning (`ReasoningPart`, enhanced-thread.tsx) and the citation card
  // (`citation-block.tsx`) both use the literal class `bg-cyan-soft`; there
  // are no other cyan-tinted blocks in the fixture, so this also confirms
  // there are exactly two.
  const cyanFills = page.locator(".bg-cyan-soft");
  await expect(cyanFills).toHaveCount(2);

  const cyanSoft = await tokenColor(page, "--km-cyan-soft");
  const backgrounds = await cyanFills.evaluateAll((els) => els.map((el) => getComputedStyle(el).backgroundColor));
  for (const bg of backgrounds) expect(bg).toBe(cyanSoft);
});

// ─── Tool states: running, completed, failed (spec scenario 9) ────────────────
//
// All three ToolStatus values. "Failed" was unreachable until
// `ToolCallBlockWrapper` started reading `isError` directly instead of
// trusting assistant-ui's forwarded `status.type` (`@assistant-ui/core`'s
// `toMessagePartStatus` collapses any tool-call part with a `result` to
// `{type: "complete"}` regardless of `isError` — see
// `docs/qa/chat-surfaces-flat2.md` §6.5 for how that was found). Now that the
// wrapper derives "failed" from `isError` itself, the fixture's
// `sync_contacts` (a `tool_result` with `success: false`) renders "Failed".
// Each pill's tone (text colour) is asserted against its status token, not
// just its label text, so the state is provably not colour-only in reverse:
// the colour itself is checked, not merely assumed present.

test("Tool states: a completed call shows an icon-and-text Completed pill, not colour alone", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openRoute(page, THREAD_ROUTE);

  const completedHeader = page.getByRole("button", { name: /calendar_list_events/ }).first();
  await expect(completedHeader.getByText("Completed", { exact: true })).toBeVisible();
  await expect(completedHeader.locator("svg").first()).toBeVisible();

  const pillColor = await completedHeader.locator(".rounded-pill").evaluate((el) => getComputedStyle(el).color);
  expect(pillColor).toBe(await tokenColor(page, "--km-success-text", "color"));
});

test("Tool states: a failed call shows an icon-and-text Failed pill, not colour alone", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openRoute(page, THREAD_ROUTE);

  const failedHeader = page.getByRole("button", { name: new RegExp(FAILED_TOOL_NAME) });
  await expect(failedHeader).toBeVisible();
  await expect(failedHeader.getByText("Failed", { exact: true })).toBeVisible();
  await expect(failedHeader.locator("svg").first()).toBeVisible();

  const pillColor = await failedHeader.locator(".rounded-pill").evaluate((el) => getComputedStyle(el).color);
  expect(pillColor).toBe(await tokenColor(page, "--km-danger-text", "color"));
});

test("Tool states: a running call (no result yet) shows an icon-and-text Running pill, not colour alone", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  // Serves a response that never closes, so this tool call never gets a
  // result and its status stays "running" — see holdChatStreamOpen
  // (e2e/support/uar-mock.ts).
  await holdChatStreamOpen(page, toSseBody(PARTIAL_STREAM_EVENTS));
  await page.goto(`/threads/${FIXTURE_THREAD_ID}`);

  const composer = page.getByPlaceholder(/Ask your agent anything/i).filter({ visible: true });
  await expect(composer).toBeVisible();
  await composer.fill("Plan my week around the rebrand launch.");
  await composer.press("Enter");

  const runningHeader = page.getByRole("button", { name: new RegExp(RUNNING_TOOL_NAME) });
  await expect(runningHeader).toBeVisible();
  await expect(runningHeader.getByText("Running", { exact: true })).toBeVisible();
  await expect(runningHeader.locator("svg").first()).toBeVisible();

  const pillColor = await runningHeader.locator(".rounded-pill").evaluate((el) => getComputedStyle(el).color);
  expect(pillColor).toBe(await tokenColor(page, "--km-cyan-text", "color"));
});

// ─── Code block (spec scenario 10) ─────────────────────────────────────────────

test("Code block: shows its language label, and the copy button has an accessible name", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openRoute(page, THREAD_ROUTE);

  const codeBody = page.locator('[aria-label="ts code"]');
  await expect(codeBody).toBeVisible();
  const codeRoot = codeBody.locator("xpath=..");

  await expect(codeRoot.getByText("ts", { exact: true })).toBeVisible();
  await expect(codeRoot.getByRole("button", { name: "Copy" })).toBeVisible();
});

// ─── HTML artifact (spec scenario 11) ──────────────────────────────────────────

test("HTML artifact: inline preview sits on the artifact canvas; full screen dims with the scrim, no blur, and Escape returns focus", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openRoute(page, THREAD_ROUTE);

  const preview = page.locator(`iframe[title="${HTML_ARTIFACT_LABEL}"]`).first();
  await expect(preview).toBeVisible();
  await expect(preview).toHaveCSS("color-scheme", "light");
  const previewBg = await preview.locator("xpath=..").evaluate((el) => getComputedStyle(el).backgroundColor);
  expect(previewBg).toBe(await tokenColor(page, "--km-artifact-canvas"));

  const fullScreenButton = page.getByRole("button", { name: "Full screen" });
  await fullScreenButton.click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();

  const overlay = page.locator('[data-slot="dialog-overlay"]');
  const overlayStyle = await overlay.evaluate((el) => {
    const s = getComputedStyle(el);
    return { bg: s.backgroundColor, blur: s.backdropFilter };
  });
  expect(overlayStyle.bg).toBe(await tokenColor(page, "--km-scrim"));
  expect(overlayStyle.blur === "none" || overlayStyle.blur === "").toBe(true);

  // Scenario 11's other half: the full-screen preview itself (a second,
  // dialog-only iframe — `html-artifact-card.tsx` renders one inline and one
  // inside `DialogContent`) sits on the same artifact-canvas backdrop as the
  // inline preview, not just the overlay behind it.
  const dialogPreview = dialog.locator(`iframe[title="${HTML_ARTIFACT_LABEL}"]`);
  await expect(dialogPreview).toBeVisible();
  const dialogPreviewBg = await dialogPreview.locator("xpath=..").evaluate((el) => getComputedStyle(el).backgroundColor);
  expect(dialogPreviewBg).toBe(await tokenColor(page, "--km-artifact-canvas"));

  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(fullScreenButton).toBeFocused();
});

// ─── Streaming indicator (spec scenario 12) ────────────────────────────────────
//
// Two independent moments, each needing its own stream: `toMessagePartStatus`
// only gives the LAST content part the message's "running" status (see the
// comment on `PARTIAL_STREAM_EVENTS` in e2e/fixtures/sse.ts), so a reasoning
// part earlier than a text part reads "complete" — the thinking pulse and the
// prose streaming mark are never both live from a single fixed stream.

test('Streaming: the reasoning trigger pulses cyan while "Thinking" is the active part', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await holdChatStreamOpen(page, toSseBody(PARTIAL_STREAM_THINKING_ONLY_EVENTS));
  await page.goto(`/threads/${FIXTURE_THREAD_ID}`);

  const composer = page.getByPlaceholder(/Ask your agent anything/i).filter({ visible: true });
  await expect(composer).toBeVisible();
  await composer.fill("Plan my week around the rebrand launch.");
  await composer.press("Enter");

  const thinkingTrigger = page.getByRole("button", { name: "Thinking" });
  await expect(thinkingTrigger).toBeVisible();

  // The reasoning trigger's pulsing dots are real DOM nodes on `bg-cyan`
  // (`ReasoningPart`, enhanced-thread.tsx), not just a colour name.
  const dotColor = await thinkingTrigger
    .locator(".animate-shimmer")
    .first()
    .evaluate((el) => getComputedStyle(el).backgroundColor);
  expect(dotColor).toBe(await tokenColor(page, "--km-cyan", "backgroundColor"));

  await page.screenshot({ path: "test-results/screenshots/thread__mid-stream-thinking.png", fullPage: false });
});

test("Streaming: the markdown streaming mark after assistant prose uses the cyan token while text is in flight", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  // Serves a response that never closes, so the message stays "running"
  // indefinitely — see holdChatStreamOpen (e2e/support/uar-mock.ts).
  await holdChatStreamOpen(page, toSseBody(PARTIAL_STREAM_EVENTS));
  await page.goto(`/threads/${FIXTURE_THREAD_ID}`);

  const composer = page.getByPlaceholder(/Ask your agent anything/i).filter({ visible: true });
  await expect(composer).toBeVisible();
  await composer.fill("Plan my week around the rebrand launch.");
  await composer.press("Enter");

  await expect(page.getByText(/Here is your plan for the week/).first()).toBeAttached();

  // The streaming mark after the last line of assistant prose
  // (`data-[status=running]:**:after:text-cyan`, enhanced-markdown-text.tsx)
  // is a `::after` pseudo-element from assistant-ui's own dot.css, recoloured
  // by that Tailwind class — read its computed colour directly.
  const markdownRoot = page.locator('.aui-md[data-status="running"]').first();
  await expect(markdownRoot).toBeAttached();
  const afterColor = await markdownRoot.evaluate((el) => {
    const last = el.lastElementChild as HTMLElement | null;
    return last ? getComputedStyle(last, "::after").color : null;
  });
  expect(afterColor).toBe(await tokenColor(page, "--km-cyan", "color"));

  await page.screenshot({ path: "test-results/screenshots/thread__mid-stream-text.png", fullPage: false });
});

// ─── Message error (review round 1 fix) ────────────────────────────────────────

test("Message error: plain-language recovery text and Try again, never the raw error", async ({ page }) => {
  await page.route("**/api/chat/completion", async (route) => {
    const body = route.request().postDataJSON() as { stream?: boolean } | null;
    if (body?.stream === false) {
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(TITLE_RESPONSE) });
    }
    // At least one content event has to precede agui.error: the streaming
    // assistant message is only created on the first delta
    // (`getOrCreateStreamingMessage`, src/stores/chat-message-store.ts), and
    // setStreamError is a no-op with no message to attach the error to.
    return route.fulfill({
      status: 200,
      contentType: "text/event-stream",
      body: toSseBody(ERROR_STREAM_EVENTS),
    });
  });

  await page.goto(`/threads/${FIXTURE_THREAD_ID}`);
  const composer = page.getByPlaceholder(/Ask your agent anything/i).filter({ visible: true });
  await expect(composer).toBeVisible();
  await composer.fill("Plan my week around the rebrand launch.");
  await composer.press("Enter");

  await expect(page.getByText(MESSAGE_ERROR_TEXT)).toBeVisible();
  await expect(page.getByRole("button", { name: "Try again" })).toBeVisible();
  await expect(page.getByText(RAW_STREAM_ERROR_TEXT)).toHaveCount(0);
});

// ─── Mermaid source and copy (spec scenario 17) ────────────────────────────────

test('Mermaid: the "Source" toggle reveals the source, and a Copy control exists, on the Week flow diagram', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openRoute(page, THREAD_ROUTE);

  const title = page.getByText("Week flow", { exact: true });
  await expect(title).toBeAttached();
  const card = title.locator("xpath=..");

  const sourceToggle = card.getByRole("button", { name: "Source" });
  await expect(sourceToggle).toBeVisible();
  await expect(sourceToggle).toHaveAttribute("aria-pressed", "false");
  await expect(card.getByRole("button", { name: /^Copy$/ })).toBeVisible();

  await sourceToggle.click();
  await expect(card.getByText(/graph LR/)).toBeVisible();
  await expect(card.getByRole("button", { name: "Diagram" })).toHaveAttribute("aria-pressed", "true");
});
