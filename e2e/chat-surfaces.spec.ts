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

    // Known, reported defect (not waived): in the dark theme, the composer's
    // "Add Attachment" button (`src/components/assistant-ui/attachment.tsx`,
    // `ComposerAddAttachment`) carries `dark:border-muted-foreground/15` — a
    // real, visible 1px border the chat-surfaces-flat2 guard never scanned
    // (`attachment.tsx` is not in its file glob). Left failing on purpose so
    // this sweep keeps catching it; see docs/qa/chat-surfaces-flat2.md.
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

// ─── Tool states: running, completed (spec scenario 9) ─────────────────────────
//
// Only two of the three ToolStatus values are reachable at runtime and get a
// test here. `docs/qa/chat-surfaces-flat2.md` records why "failed" cannot be
// closed without app code: `@assistant-ui/core`'s `toMessagePartStatus`
// (`node_modules/@assistant-ui/core/dist/utils/normalizePartStatus.js`)
// hardcodes a tool-call part's status to `{type: "complete"}` whenever
// `result !== undefined`, regardless of `isError` — so `use-chat-runtime.ts`
// passing `isError: block.status === "failed"` can never produce the
// `{type: "incomplete"}` that `ToolCallBlockWrapper` maps to the "Failed"
// pill. Confirmed by probing a held-open stream where a tool_result with
// `success: false` still renders "Completed". `sync_contacts` (with a
// `success: false` result) stays in the fixture and its marker is still
// asserted (`e2e/support/routes.ts`) so the store/render path for a failed
// result is at least exercised and visible in capture review, even though
// its pill text is wrong.

test("Tool states: a completed call shows an icon-and-text Completed pill, not colour alone", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openRoute(page, THREAD_ROUTE);

  const completedHeader = page.getByRole("button", { name: /calendar_list_events/ }).first();
  await expect(completedHeader.getByText("Completed", { exact: true })).toBeVisible();
  await expect(completedHeader.locator("svg").first()).toBeVisible();
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
