/**
 * Integration gate for change `app-block-copy-and-media-blocks` (KBD task 3.8,
 * phase `chat-export-and-block-copy`): one stubbed assistant reply carries
 * every block type, and each block's Copy button is exercised through the
 * real clipboard.
 *
 * Runs on both builds (site flags or none: the composer is found by its
 * label) and on two projects:
 *   - chromium: clipboard-read/write granted, every copied text read back
 *     with navigator.clipboard.readText and compared with the expected text.
 *   - webkit-iphone: WebKit cannot be granted clipboard-read by Playwright,
 *     so the readback assertions are skipped there. The WebKit test still
 *     clicks every Copy button and asserts a visible "Copied" or "Couldn't
 *     copy" state (never an unhandled page error).
 *
 *   npx playwright test e2e/block-copy.spec.ts --project=chromium
 *   VITE_SITE_AGENT_ID=knowme-site VITE_SITE_WEB_SEARCH=1 \
 *     npx playwright test e2e/block-copy.spec.ts --project=chromium
 *   npx playwright test e2e/block-copy.spec.ts --project=webkit-iphone
 */
import fs from "node:fs";
import path from "node:path";
import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";
import { expect, test } from "./support/test";
import { seedTheme } from "./support/page-helpers";
import { FIXTURE_THREAD_ID, THEMES, waitForAppReady } from "./support/routes";
import { FIXTURE_IMAGE_PNG_BASE64, TITLE_RESPONSE, toSseBody, type SseEvent } from "./fixtures/sse";
import { AI_SURFACE_CAPTION } from "../content/site/ai-disclosure";

const rid = "req-block-copy-e2e";
const CAPTURE_DIR = path.resolve("docs/qa/block-copy-captures");

const CODE = "export function double(n: number): number {\n  return n * 2;\n}";
const MERMAID = "graph LR\n  Plan --> Build --> Review";
const SVG_HARMLESS =
  '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40"><circle cx="20" cy="20" r="16" fill="#c2410c"/></svg>';
const SVG_HOSTILE =
  '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" onload="window.__pwned=1"><script>window.__pwned=2</script><rect width="40" height="40" fill="#1d4ed8"/></svg>';
const TABLE_MD = "| Block | Copies |\n| --- | --- |\n| code | the source |\n| table | GitHub markdown |";
const MATH_TEX = "x^2+y^2";
const OWN_IMAGE_URL = "https://know-me.tools/e2e/block-copy-swatch.png";
const OWN_VIDEO_URL = "https://know-me.tools/media/tour.mp4";
const CARD_TITLE = "Weekly summary";
const CARD_SUMMARY = "Three meetings and two deadlines this week.";
const CARD_SOURCE = "Source: team calendar";
const CARD_TEXT = [CARD_TITLE, CARD_SUMMARY, CARD_SOURCE, AI_SURFACE_CAPTION].join("\n");

const REPLY = [
  "Every block type in one reply.\n\n",
  `\`\`\`ts\n${CODE}\n\`\`\`\n\n`,
  `\`\`\`mermaid\n${MERMAID}\n\`\`\`\n\n`,
  `\`\`\`svg\n${SVG_HARMLESS}\n\`\`\`\n\n`,
  `\`\`\`svg\n${SVG_HOSTILE}\n\`\`\`\n\n`,
  `${TABLE_MD}\n\n`,
  `$$\n${MATH_TEX}\n$$\n\n`,
  `![Own-host swatch](${OWN_IMAGE_URL})\n\n`,
  `<video controls><source src="${OWN_VIDEO_URL}" type="video/mp4"></video>\n\n`,
  "That is every block.",
].join("");

const SURFACE = "block-copy-card";
const A2UI_CONTENT = [
  { version: "v0.9.1", createSurface: { surfaceId: SURFACE, catalogId: "urn:uar:a2ui:catalog:1" } },
  {
    version: "v0.9.1",
    updateComponents: {
      surfaceId: SURFACE,
      components: [
        { id: "root", component: "Card", child: "body" },
        { id: "body", component: "Column", children: ["title", "summary", "source"] },
        { id: "title", component: "Text", variant: "h3", text: CARD_TITLE },
        { id: "summary", component: "Text", variant: "body", text: CARD_SUMMARY },
        { id: "source", component: "Text", variant: "body", text: CARD_SOURCE },
      ],
    },
  },
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
      artifact_id: "art-block-copy-card",
      artifact_type: "a2ui",
      title: "Answer",
      content: A2UI_CONTENT,
    },
  },
  { event: "agui.message.delta", data: { kind: "message", phase: "delta", request_id: rid, delta: { text: REPLY } } },
  { event: "agui.done", data: { kind: "done", request_id: rid } },
];

/** Copy buttons in reply order, with the clipboard text each must produce. */
const COPY_TARGETS = [
  { label: "Copy code", nth: 0, expected: CODE },
  { label: "Copy diagram source", nth: 0, expected: MERMAID },
  { label: "Copy SVG source", nth: 0, expected: SVG_HARMLESS },
  { label: "Copy SVG source", nth: 1, expected: SVG_HOSTILE },
  { label: "Copy table", nth: 0, expected: TABLE_MD },
  { label: "Copy math source", nth: 0, expected: MATH_TEX },
  { label: "Copy video link", nth: 0, expected: OWN_VIDEO_URL },
  { label: "Copy card text", nth: 0, expected: CARD_TEXT },
] as const;

const COPY_STATE = /^(Copied|Copied image|Copied image link|Couldn't copy)$/;

async function openThreadWithAllBlocks(page: Page, width: number, theme: (typeof THEMES)[number]): Promise<void> {
  await seedTheme(page, theme);
  await page.setViewportSize({ width, height: 900 });
  // The own-host image cannot load offline, so the stub stands in for the origin.
  await page.route(OWN_IMAGE_URL, (route) =>
    route.fulfill({ status: 200, contentType: "image/png", body: Buffer.from(FIXTURE_IMAGE_PNG_BASE64, "base64") }),
  );
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
  await expect(composer).toBeVisible();
  await composer.fill("Show me every block.");
  await composer.press("Enter");

  await expect(page.getByText("That is every block.").first()).toBeAttached();
  await expect(page.getByTestId("a2ui-surface")).toBeVisible();
  await expect(page.getByRole("button", { name: "Copy code" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Copy diagram source" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Copy SVG source" })).toHaveCount(2);
  await expect(page.getByRole("button", { name: "Copy table" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Copy math source" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Copy image", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Copy video link" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Copy card text" })).toBeVisible();
  await expect(page.getByText("Rendering diagram")).toHaveCount(0);
  await page.evaluate(() => document.fonts.ready);
}

/** The thread scrolls inside its own container: grow the viewport so a screenshot shows all of it. */
async function expandToScrollableContent(page: Page): Promise<void> {
  const overflow = await page.evaluate(() => {
    let extra = 0;
    for (const el of Array.from(document.querySelectorAll<HTMLElement>("*"))) {
      if (!/(auto|scroll)/.test(getComputedStyle(el).overflowY)) continue;
      extra = Math.max(extra, el.scrollHeight - el.clientHeight);
    }
    return extra;
  });
  const size = page.viewportSize();
  if (size && overflow > 0) await page.setViewportSize({ width: size.width, height: size.height + overflow });
}

/** The visible state a Copy button reached: its own text (labelled) or its live region (icon). */
async function copyState(page: Page, label: string, nth: number): Promise<string> {
  return page
    .getByRole("button", { name: label, exact: true })
    .nth(nth)
    .evaluate((button) => {
      const own = (button.textContent ?? "").trim();
      const live = button.nextElementSibling?.getAttribute("role") === "status" ? (button.nextElementSibling.textContent ?? "").trim() : "";
      return live || own;
    });
}

test.describe("block copy: clipboard contents (Chromium)", () => {
  test.skip(({ browserName }) => browserName !== "chromium", "Clipboard readback needs clipboard-read, which only Chromium grants.");

  test("each block's Copy button puts exactly that block's text on the clipboard", async ({ page, context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await openThreadWithAllBlocks(page, 1440, "light");

    for (const { label, nth, expected } of COPY_TARGETS) {
      await page.evaluate(() => navigator.clipboard.writeText("sentinel-before-click"));
      const button = page.getByRole("button", { name: label, exact: true }).nth(nth);
      await button.scrollIntoViewIfNeeded();
      await button.click();
      await expect.poll(() => copyState(page, label, nth), { message: `${label} #${nth} state` }).toMatch(COPY_STATE);
      expect(await copyState(page, label, nth), `${label} #${nth} succeeded`).toMatch(/^Copied/);
      const copied = await page.evaluate(() => navigator.clipboard.readText());
      expect(copied, `${label} #${nth} clipboard text`).toBe(expected);
    }
  });

  test("the card copy ends with the AI caption", async ({ page, context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await openThreadWithAllBlocks(page, 1440, "dark");
    await page.getByRole("button", { name: "Copy card text" }).click();
    await expect.poll(() => copyState(page, "Copy card text", 0)).toMatch(/^Copied/);
    const copied = await page.evaluate(() => navigator.clipboard.readText());
    expect(copied.endsWith("AI-generated · check important details")).toBe(true);
    expect(copied.endsWith(AI_SURFACE_CAPTION)).toBe(true);
    expect(copied).toContain(CARD_TITLE);
    expect(copied).toContain(CARD_SUMMARY);
    expect(copied).toContain(CARD_SOURCE);
  });

  test("the image copy puts an image (or its link) on the clipboard and says which", async ({ page, context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await openThreadWithAllBlocks(page, 1440, "light");
    const image = page.locator('[data-role="assistant"] img[alt="Own-host swatch"]');
    await expect(image).toHaveAttribute("src", OWN_IMAGE_URL);
    await page.getByRole("button", { name: "Copy image", exact: true }).click();
    await expect.poll(() => copyState(page, "Copy image", 0)).toMatch(/^Copied image/);
    const types = await page.evaluate(async () => (await navigator.clipboard.read()).flatMap((item) => item.types));
    expect(types).toContain("image/png");
  });

  test("a refused clipboard write shows the visible Couldn't copy state and throws nothing", async ({ page, context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    const pageErrors: string[] = [];
    page.on("pageerror", (error) => pageErrors.push(error.message));
    await openThreadWithAllBlocks(page, 1440, "light");
    await page.evaluate(() => {
      navigator.clipboard.writeText = () => Promise.reject(new Error("denied by test"));
    });
    const button = page.getByRole("button", { name: "Copy code", exact: true });
    await button.click();
    await expect(button).toContainText("Couldn't copy");
    await expect(page.getByRole("status").filter({ hasText: "Couldn't copy" })).toHaveCount(1);
    expect(pageErrors).toEqual([]);
  });
});

test.describe("block copy: rendering safety and accessibility", () => {
  test("the hostile svg renders only as an img: no script, no live svg, no handler, nothing executed", async ({ page }) => {
    const pageErrors: string[] = [];
    page.on("pageerror", (error) => pageErrors.push(error.message));
    await openThreadWithAllBlocks(page, 1440, "light");
    const reply = page.locator('[data-role="assistant"]').last();

    await expect(reply.locator("script")).toHaveCount(0);
    await expect(reply.locator("[onload], [onerror], [onclick]")).toHaveCount(0);

    const svgImages = reply.locator('img[src^="data:image/svg+xml"]');
    await expect(svgImages).toHaveCount(2);
    const hostileSrc = decodeURIComponent((await svgImages.nth(1).getAttribute("src")) ?? "");
    expect(hostileSrc).toContain("<script>");

    // Any svg element in the reply must be decorative (aria-hidden), or be the
    // Mermaid renderer's own diagram, which is not model-supplied svg.
    const exposed = await reply.evaluate((root) =>
      Array.from(root.querySelectorAll("svg"))
        .filter((svg) => svg.getAttribute("aria-hidden") !== "true" && svg.closest('[aria-hidden="true"]') === null)
        .filter((svg) => svg.closest("[data-mermaid-diagram], [class*='mermaid']") === null && !svg.id.startsWith("mermaid"))
        .map((svg) => svg.outerHTML.slice(0, 160)),
    );
    expect(exposed, "svg elements in the reply without aria-hidden").toEqual([]);

    expect(await page.evaluate(() => (window as unknown as { __pwned?: number }).__pwned)).toBeUndefined();
    expect(pageErrors).toEqual([]);
  });

  test("the own-host image loads and the video is an own-host video element", async ({ page }) => {
    await openThreadWithAllBlocks(page, 1440, "light");
    const reply = page.locator('[data-role="assistant"]').last();
    const image = reply.locator('img[alt="Own-host swatch"]');
    await expect(image).toBeVisible();
    expect(await image.evaluate((img: HTMLImageElement) => img.naturalWidth)).toBeGreaterThan(0);
    const video = reply.locator("video");
    await expect(video).toHaveCount(1);
    await expect(video.locator("source")).toHaveAttribute("src", OWN_VIDEO_URL);
    await expect(video).toHaveAttribute("preload", "none");
  });

  for (const theme of THEMES) {
    test(`axe finds no WCAG 2.x A/AA violation in the thread with every block shown (${theme})`, async ({ page }, testInfo) => {
      await openThreadWithAllBlocks(page, 1440, theme);
      const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
      await testInfo.attach(`axe-${theme}`, { body: JSON.stringify(results.violations, null, 2), contentType: "application/json" });
      // Same policy as e2e/a11y.spec.ts: a logotype has no contrast requirement
      // (WCAG 1.4.3), so the wordmark's ember "Me" is left out of color-contrast only.
      const violations = [];
      for (const violation of results.violations) {
        if (violation.id !== "color-contrast") {
          violations.push(violation);
          continue;
        }
        const inLogotype = await page.evaluate(
          (selectors) => selectors.map((s) => document.querySelector(s)?.closest("[data-slot='knowme-wordmark']") != null),
          violation.nodes.map((n) => String(n.target[0])),
        );
        const nodes = violation.nodes.filter((_, i) => !inLogotype[i]);
        if (nodes.length > 0) violations.push({ ...violation, nodes });
      }
      const summary = violations.map(
        (v) => `${v.id} (${v.impact}) x${v.nodes.length}: ${v.nodes.map((n) => n.target.join(" ")).slice(0, 3).join(" | ")}`,
      );
      expect(summary, `axe violations in the ${theme} theme`).toEqual([]);
    });
  }

  test("keyboard: Tab reaches every Copy button and Enter activates it", async ({ page, context, browserName }) => {
    // WebKit on iOS does not Tab to buttons without a keyboard-access setting; the
    // Tab walk is only meaningful where Tab focuses buttons (Chromium).
    test.skip(browserName !== "chromium", "Tab-to-button is not the WebKit/iPhone keyboard model.");
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    const pageErrors: string[] = [];
    page.on("pageerror", (error) => pageErrors.push(error.message));
    await openThreadWithAllBlocks(page, 1440, "light");

    const wanted = [...COPY_TARGETS.map((t) => t.label), "Copy image"];
    const reached: string[] = [];
    // Start from the top of the document so every block lies ahead of focus.
    await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
    for (let i = 0; i < 600 && reached.length < wanted.length; i += 1) {
      await page.keyboard.press("Tab");
      const label = await page.evaluate(() => document.activeElement?.getAttribute("aria-label") ?? "");
      if (!label.startsWith("Copy ")) continue;
      reached.push(label);
      await page.keyboard.press("Enter");
      await expect
        .poll(() =>
          page.evaluate(() => {
            const button = document.activeElement as HTMLElement | null;
            const live = button?.nextElementSibling?.getAttribute("role") === "status" ? (button.nextElementSibling.textContent ?? "").trim() : "";
            return live || (button?.textContent ?? "").trim();
          }),
        )
        .toMatch(COPY_STATE);
    }
    expect([...reached].sort(), "Copy buttons reached by Tab, each activated with Enter").toEqual([...wanted].sort());
    expect(pageErrors).toEqual([]);
  });
});

test.describe("block copy: svg block header at phone width", () => {
  for (const theme of THEMES) {
    test(`every control in the SVG header is fully inside the block and 44 px tall at 320px (${theme})`, async ({ page }) => {
      await openThreadWithAllBlocks(page, 320, theme);
      const copyButtons = page.getByRole("button", { name: "Copy SVG source", exact: true });
      await expect(copyButtons).toHaveCount(2);
      for (let i = 0; i < 2; i += 1) {
        await copyButtons.nth(i).scrollIntoViewIfNeeded();
        // The header is the copy button's grandparent row; the block is its parent.
        const report = await copyButtons.nth(i).evaluate((copy) => {
          const group = copy.parentElement as HTMLElement;
          const header = group.closest("[data-svg-header]") ?? (group.parentElement as HTMLElement);
          const block = header.parentElement as HTMLElement;
          const box = block.getBoundingClientRect();
          return Array.from(header.querySelectorAll("button")).map((button) => {
            const r = button.getBoundingClientRect();
            return {
              name: button.getAttribute("aria-label") ?? (button.textContent ?? "").trim(),
              left: r.left - box.left,
              right: box.right - r.right,
              top: r.top - box.top,
              bottom: header.getBoundingClientRect().bottom - r.bottom,
              height: r.height,
              width: r.width,
              blockWidth: box.width,
            };
          });
        });
        expect(report.length, "buttons in the SVG header").toBeGreaterThanOrEqual(4);
        for (const control of report) {
          expect(control.left, `${control.name} left edge inside the block`).toBeGreaterThanOrEqual(-0.5);
          expect(control.right, `${control.name} right edge inside the block (not clipped)`).toBeGreaterThanOrEqual(-0.5);
        }
        for (const control of report) {
          expect(control.height, `${control.name} touch target height`).toBeGreaterThanOrEqual(43.5);
          expect(control.width, `${control.name} touch target width`).toBeGreaterThanOrEqual(43.5);
        }
      }
    });
  }
});

test.describe("block copy: WebKit (iPhone) click path", () => {
  test.skip(({ browserName }) => browserName !== "webkit", "WebKit-only: no clipboard readback is possible there.");

  test("every Copy button shows Copied or Couldn't copy when clicked and nothing throws", async ({ page }) => {
    const pageErrors: string[] = [];
    page.on("pageerror", (error) => pageErrors.push(error.message));
    await openThreadWithAllBlocks(page, 390, "light");
    for (const { label, nth } of [...COPY_TARGETS, { label: "Copy image", nth: 0 }]) {
      const button = page.getByRole("button", { name: label, exact: true }).nth(nth);
      await button.scrollIntoViewIfNeeded();
      await button.click();
      await expect.poll(() => copyState(page, label, nth), { message: `${label} #${nth}` }).toMatch(COPY_STATE);
    }
    expect(pageErrors).toEqual([]);
  });
});

test.describe("block copy: captures", () => {
  test.skip(({ browserName }) => browserName !== "chromium", "Captures are Chromium-only.");

  for (const theme of THEMES) {
    for (const width of [320, 1440] as const) {
      test(`captures the thread with every block at ${width}px in the ${theme} theme`, async ({ page }) => {
        await openThreadWithAllBlocks(page, width, theme);
        await expandToScrollableContent(page);
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        expect(overflow, "no page-level horizontal scroll").toBeLessThanOrEqual(0);
        fs.mkdirSync(CAPTURE_DIR, { recursive: true });
        await page.screenshot({ path: path.join(CAPTURE_DIR, `block-copy__${width}__${theme}.png`) });
      });
    }
  }
});
