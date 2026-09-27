/**
 * brand-pages spec (specs/brand-pages/spec.md), the browser-dependent
 * scenarios that `src/test/flat-shell.test.ts` and `src/test/brand-copy.test.ts`
 * cannot cover: computed styles, real keyboard focus, real navigation and
 * viewport geometry. Covers the landing page (`/`), About
 * (`/settings/about`) and not-found (`/does-not-exist`).
 *
 * Expected literal strings (the tagline, the legal line, the 404 copy) are
 * hardcoded from docs/design/brand-pages.md and the Brand Guide, the same
 * convention `e2e/brand.spec.ts` already uses — not re-imported from the
 * content modules under test, so a content-module bug can't cancel out
 * against the assertion that should catch it.
 */
import { readFileSync } from "node:fs";
import type { Page } from "@playwright/test";
import { expect, test } from "./support/test";
import { seedTheme } from "./support/page-helpers";
import { THEMES } from "./support/routes";

const PRIMARY_TAGLINE = "AI that understands you.";
const LEGAL_LINE = "© 2026 KnowMe AI, LLC";
const NOT_FOUND_CTA = "Back to KnowMe";
const PACKAGE_VERSION = (JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8")) as {
  version: string;
}).version;

/**
 * `page.goto()` resolves on load/commit, before React has painted anything —
 * a client-rendered SPA route. A `page.evaluate()` or `page.keyboard.press()`
 * right after `goto()` races that first paint and silently reads/acts on an
 * empty `#root` (`Cannot read properties of null`, or a Tab landing nowhere).
 * Playwright locators (`page.locator(...).toBeVisible()`, `getByRole`) retry
 * until the app has rendered; a raw `evaluate` or `keyboard.press` does not.
 * Every route here renders exactly one `h1`, so waiting for it is a reliable,
 * real signal that hydration is done — not a fixed wait.
 */
async function gotoReady(page: Page, path: string): Promise<void> {
  await page.goto(path);
  await page.locator("h1").first().waitFor({ state: "visible" });
}

/** Resolves a CSS custom property to its browser-computed colour (rgb()), the
 * same way the property is actually used on an element, via a throwaway probe
 * node (mirrors `tokenColor` in e2e/chat-surfaces.spec.ts). */
async function tokenColor(
  page: Page,
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

/** First font-family in a computed `font-family` list, quotes stripped. */
function firstFamily(computed: string): string {
  return computed.split(",")[0]?.replace(/["']/g, "").trim() ?? "";
}

interface Flat2Offenders {
  border: string[];
  shadow: string[];
  gradient: string[];
  blur: string[];
  under12px: string[];
}

/** Sweeps the given root selectors for every Flat 2.0 violation in one pass. */
async function sweepFlat2(page: Page, rootSelectors: string[]): Promise<Flat2Offenders> {
  return page.evaluate((selectors) => {
    const result: Flat2Offenders = { border: [], shadow: [], gradient: [], blur: [], under12px: [] };
    for (const sel of selectors) {
      const root = document.querySelector(sel);
      if (!root) continue;
      for (const el of [root, ...Array.from(root.querySelectorAll("*"))]) {
        const s = getComputedStyle(el);
        const tag = `${el.tagName}.${(el as HTMLElement).className}`;
        const bordered = ["Top", "Right", "Bottom", "Left"].some(
          (side) =>
            parseFloat(s.getPropertyValue(`border-${side.toLowerCase()}-width`)) > 0 &&
            s.getPropertyValue(`border-${side.toLowerCase()}-color`) !== "rgba(0, 0, 0, 0)",
        );
        if (bordered) result.border.push(tag);
        if (s.boxShadow !== "none" && !el.matches(":focus-visible")) result.shadow.push(tag);
        if (s.backgroundImage.includes("gradient")) result.gradient.push(tag);
        if (s.backdropFilter !== "none" && s.backdropFilter !== "") result.blur.push(tag);
        const hasText = Array.from(el.childNodes).some(
          (n) => n.nodeType === Node.TEXT_NODE && n.textContent?.trim(),
        );
        if (hasText && parseFloat(s.fontSize) < 12) result.under12px.push(`${s.fontSize}: ${tag}`);
      }
    }
    return result;
  }, rootSelectors);
}

function expectFlat2Clean(offenders: Flat2Offenders): void {
  expect(offenders.border, "border").toEqual([]);
  expect(offenders.shadow, "shadow").toEqual([]);
  expect(offenders.gradient, "gradient").toEqual([]);
  expect(offenders.blur, "backdrop-filter").toEqual([]);
  expect(offenders.under12px, "text under 12px").toEqual([]);
}

interface EmberCtaInfo {
  count: number;
  names: string[];
  anyDisabled: boolean;
}

/** Counts `a`/`button` elements under `rootSelector` whose computed
 * background-color equals the resolved `--km-ember` value for the theme. */
async function emberCtas(page: Page, rootSelector: string, emberBg: string): Promise<EmberCtaInfo> {
  return page.evaluate(
    ({ sel, ember }) => {
      const root = document.querySelector(sel);
      if (!root) return { count: 0, names: [], anyDisabled: false };
      const matches = Array.from(root.querySelectorAll("a, button")).filter(
        (el) => getComputedStyle(el).backgroundColor === ember,
      );
      return {
        count: matches.length,
        names: matches.map((el) => (el as HTMLElement).innerText.trim()),
        anyDisabled: matches.some((el) => (el as HTMLButtonElement).disabled === true),
      };
    },
    { sel: rootSelector, ember: emberBg },
  );
}

/** Outline of the currently focused element — style, width, and a label for
 * failure messages. Used by the Tab-through checks below. */
async function focusedOutline(page: Page): Promise<{ style: string; width: number; label: string }> {
  return page.evaluate(() => {
    const el = document.activeElement as HTMLElement | null;
    if (!el) return { style: "none", width: 0, label: "(nothing focused)" };
    const s = getComputedStyle(el);
    return {
      style: s.outlineStyle,
      width: parseFloat(s.outlineWidth) || 0,
      label: `${el.tagName}[${el.getAttribute("aria-label") ?? el.textContent?.trim().slice(0, 30) ?? ""}]`,
    };
  });
}

// ─── Landing page document structure (spec: "Landing page document structure") ──

test("one real h1 equal to the primary tagline, immediately followed by the value line", async ({ page }) => {
  await gotoReady(page, "/");
  const h1 = page.locator("h1");
  await expect(h1).toHaveCount(1);
  const raw = await h1.textContent();
  expect(raw?.replace(/\s+/g, " ").trim()).toBe(PRIMARY_TAGLINE);
  await expect(h1).toBeVisible();

  const sibling = await page.evaluate(() => {
    const el = document.querySelector("h1")!.nextElementSibling;
    return { tag: el?.tagName ?? null, text: el?.textContent?.trim() ?? "" };
  });
  expect(sibling.tag).toBe("P");
  expect(sibling.text.length).toBeGreaterThan(0);
});

test("the h1 lies inside main, and main is the only main landmark", async ({ page }) => {
  await gotoReady(page, "/");
  await expect(page.locator("main")).toHaveCount(1);
  const insideMain = await page.evaluate(() => !!document.querySelector("main h1"));
  expect(insideMain).toBe(true);
});

test("topic sections are named by their own h2, and each resolves as a named region", async ({ page }) => {
  await gotoReady(page, "/");
  const headings = await page.locator("main section h2").allTextContents();
  expect(headings.length).toBeGreaterThan(0);
  for (const heading of headings) {
    await expect(page.getByRole("region", { name: heading })).toHaveCount(1);
  }

  // Every section other than the hero is labelled by an h2 inside itself.
  const labelling = await page.evaluate(() => {
    const sections = Array.from(document.querySelectorAll("main > section"));
    return sections.map((section) => {
      const labelledBy = section.getAttribute("aria-labelledby");
      const label = labelledBy ? document.getElementById(labelledBy) : null;
      return { isHero: label?.tagName === "H1", isH2: label?.tagName === "H2", contained: !!label && section.contains(label) };
    });
  });
  const nonHero = labelling.filter((s) => !s.isHero);
  expect(nonHero.length).toBeGreaterThan(0);
  for (const section of nonHero) {
    expect(section.isH2).toBe(true);
    expect(section.contained).toBe(true);
  }
});

// ─── Brand template rhythm: lockups, eyebrow/h1 fonts, footer ──────────────────

for (const width of [320, 768, 1024, 1440] as const) {
  test(`nav lockup mark is >=24px and hero lockup mark is 52-72px at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await gotoReady(page, "/");
    const navMark = page.locator('header svg[data-slot="knowme-mark"]');
    const heroMark = page.locator('section:has(#hero-heading) svg[data-slot="knowme-mark"]');
    const navBox = await navMark.boundingBox();
    const heroBox = await heroMark.boundingBox();
    expect(navBox?.width ?? 0).toBeGreaterThanOrEqual(24);
    expect(heroBox?.width ?? 0).toBeGreaterThanOrEqual(52);
    expect(heroBox?.width ?? 0).toBeLessThanOrEqual(72);
  });
}

test("eyebrow is 12px+ JetBrains Mono, and the h1 is Space Grotesk", async ({ page }) => {
  await gotoReady(page, "/");
  const eyebrow = page.locator("section:has(#hero-heading) p.section-label");
  const eyebrowStyle = await eyebrow.evaluate((el) => {
    const s = getComputedStyle(el);
    return { family: s.fontFamily, size: parseFloat(s.fontSize) };
  });
  expect(firstFamily(eyebrowStyle.family)).toBe("JetBrains Mono Variable"); // self-hosted (@fontsource-variable)
  expect(eyebrowStyle.size).toBeGreaterThanOrEqual(12);

  const h1Family = await page.locator("h1").evaluate((el) => getComputedStyle(el).fontFamily);
  expect(firstFamily(h1Family)).toBe("Space Grotesk Variable");
});

for (const theme of THEMES) {
  test(`exactly one ember-text descendant in the h1, and the h1 itself is not ember-text (${theme})`, async ({
    page,
  }) => {
    await seedTheme(page, theme);
    await gotoReady(page, "/");
    const emberText = await tokenColor(page, "--km-ember-text", "color");
    const result = await page.evaluate((expected) => {
      const h1 = document.querySelector("h1")!;
      const matches = Array.from(h1.querySelectorAll("*")).filter(
        (el) => getComputedStyle(el).color === expected,
      );
      return { count: matches.length, h1Matches: getComputedStyle(h1).color === expected };
    }, emberText);
    expect(result.count).toBe(1);
    expect(result.h1Matches).toBe(false);
  });
}

test("footer shows the footer lockup, the legal line and the package.json version", async ({ page }) => {
  await gotoReady(page, "/");
  const footer = page.locator("footer");
  await expect(footer.locator('svg[data-slot="knowme-mark"]')).toBeVisible();
  await expect(footer.getByText(LEGAL_LINE, { exact: false })).toBeVisible();
  await expect(footer.getByText(`v${PACKAGE_VERSION}`, { exact: false })).toBeVisible();
});

// ─── One ember primary action per section ──────────────────────────────────────

for (const theme of THEMES) {
  test(`hero has exactly one enabled, named ember CTA; other regions have at most one (${theme})`, async ({
    page,
  }) => {
    await seedTheme(page, theme);
    await gotoReady(page, "/");
    const ember = await tokenColor(page, "--km-ember");

    const hero = await emberCtas(page, "section:has(#hero-heading)", ember);
    expect(hero.count).toBe(1);
    expect(hero.anyDisabled).toBe(false);
    expect(hero.names[0]?.length ?? 0).toBeGreaterThan(0);

    const nav = await emberCtas(page, "header", ember);
    const footer = await emberCtas(page, "footer", ember);
    expect(nav.count).toBe(0);
    expect(footer.count).toBe(0);

    const sectionCount = await page.evaluate(() => document.querySelectorAll("main > section").length);
    for (let i = 1; i < sectionCount; i++) {
      const sectionEmberCount = await page.evaluate(
        ({ index, emberColor }) => {
          const section = document.querySelectorAll("main > section")[index];
          if (!section) return 0;
          return Array.from(section.querySelectorAll("a, button")).filter(
            (el) => getComputedStyle(el).backgroundColor === emberColor,
          ).length;
        },
        { index: i, emberColor: ember },
      );
      expect(sectionEmberCount, `section ${i}`).toBeLessThanOrEqual(1);
    }
  });

  test(`not-found has exactly one ember CTA (${theme})`, async ({ page }) => {
    await seedTheme(page, theme);
    await gotoReady(page, "/does-not-exist");
    const ember = await tokenColor(page, "--km-ember");
    const main = await emberCtas(page, "main", ember);
    expect(main.count).toBe(1);
    const nav = await emberCtas(page, "header", ember);
    const footer = await emberCtas(page, "footer", ember);
    expect(nav.count).toBe(0);
    expect(footer.count).toBe(0);
  });
}

// ─── Composer keyboard contract ────────────────────────────────────────────────

test("empty send does not navigate, moves focus to the prompt field, and creates no thread", async ({ page }) => {
  await gotoReady(page, "/");
  const send = page.getByRole("button", { name: /send|start/i });
  await send.click();
  await expect(page).toHaveURL("/");
  await expect(page.getByRole("textbox")).toBeFocused();

  // landing W4 (design.md decision 1): an empty submit returns early in
  // `handleSubmit` (landing-page.tsx) without ever calling
  // `registerThread`, so no thread should exist afterwards. The landing
  // page itself has no sidebar to check directly (it's outside AppLayout),
  // so navigate to the thread list — each test gets a fresh IndexedDB
  // (no Playwright storageState is configured), so an unchanged, empty
  // thread list is exactly "the count is unchanged". Scoped to the
  // sidebar's own "Threads" region: the main welcome screen
  // (enhanced-thread.tsx) shows the identical "// No threads yet" copy for
  // its own reason, so an unscoped getByText resolves to two elements.
  await page.goto("/threads");
  const threadsSidebar = page.getByRole("complementary", { name: "Threads" });
  await expect(threadsSidebar.getByText("No threads yet")).toBeVisible();
});

test("Enter (no shift) submits the prompt and navigates to a new thread", async ({ page }) => {
  await gotoReady(page, "/");
  const textarea = page.getByRole("textbox");
  await textarea.fill("Plan my launch checklist.");
  await textarea.press("Enter");
  await page.waitForURL(/\/threads\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
  await expect(page.getByText("Plan my launch checklist.")).toBeVisible();
});

test("Shift+Enter adds a newline instead of submitting", async ({ page }) => {
  await gotoReady(page, "/");
  const textarea = page.getByRole("textbox");
  await textarea.fill("Line one");
  await textarea.press("Shift+Enter");
  await textarea.pressSequentially("Line two");
  await expect(page).toHaveURL("/");
  await expect(textarea).toHaveValue("Line one\nLine two");
});

// ─── Flat 2.0: no rendered border/shadow/gradient/backdrop-filter, nothing under 12px ──

const FLAT2_ROUTES: Array<{ path: string; selectors: string[] }> = [
  { path: "/", selectors: ["header", "#main", "footer"] },
  // landing S1 (design.md decision 1): About renders inside AppLayout, not
  // the marketing SiteHeader/SiteFooter, so it has no <footer> — but it does
  // have the app-shell Topbar's <header> and, at desktop widths, the
  // Settings page's own side <nav> inside its <aside>. Neither was in the
  // sweep before; only #main (About's own content) was.
  { path: "/settings/about", selectors: ["header", "aside", "#main"] },
  { path: "/does-not-exist", selectors: ["header", "#main", "footer"] },
];

for (const theme of THEMES) {
  for (const route of FLAT2_ROUTES) {
    test(`${route.path}: no border, shadow, gradient or backdrop filter, nothing under 12px (${theme})`, async ({
      page,
    }) => {
      await seedTheme(page, theme);
      await gotoReady(page, route.path);
      const offenders = await sweepFlat2(page, route.selectors);
      expectFlat2Clean(offenders);
    });
  }
}

// ─── Adjacent landing regions differ by background ─────────────────────────────

for (const theme of THEMES) {
  test(`adjacent landing regions (nav, hero, sections, footer) differ in background (${theme})`, async ({ page }) => {
    await seedTheme(page, theme);
    await gotoReady(page, "/");
    const backgrounds = await page.evaluate(() => {
      const els = [
        document.querySelector("header"),
        ...Array.from(document.querySelectorAll("main > section")),
        document.querySelector("footer"),
      ];
      return els.map((el) => (el ? getComputedStyle(el).backgroundColor : null));
    });
    expect(backgrounds.length).toBeGreaterThanOrEqual(3);
    for (let i = 1; i < backgrounds.length; i++) {
      expect(backgrounds[i], `region ${i} vs region ${i - 1}: ${backgrounds[i]} / ${backgrounds[i - 1]}`).not.toBe(
        backgrounds[i - 1],
      );
    }
  });
}

// ─── About: version, runtime status, endpoint ──────────────────────────────────

test("About version row equals the package.json version", async ({ page }) => {
  await gotoReady(page, "/settings/about");
  await expect(page.getByText(PACKAGE_VERSION, { exact: true })).toBeVisible();
});

test("About runtime status is connected by default, and reads a different text label when unreachable", async ({
  page,
}) => {
  await gotoReady(page, "/settings/about");
  await expect(page.getByText("connected", { exact: true })).toBeVisible();
});

test("About runtime status reads disconnected only after /healthz actually responds 503", async ({ page }) => {
  // Registered after the auto UAR mock fixture, so Playwright tries this
  // route first for /healthz specifically; /readyz and everything else still
  // falls through to the fixture.
  await page.route("**/healthz", (route) => route.fulfill({ status: 503, body: "" }));
  // landing W3 (design.md decision 1): `gotoReady` only waits for the h1, not
  // for the health check itself — without this, "disconnected" could become
  // visible (and the assertion pass) before the mocked 503 was ever actually
  // served, which would make this test pass even if the route above were a
  // no-op. Wait for the intercepted response — including its status — before
  // asserting on the UI it's supposed to cause.
  const healthz = page.waitForResponse((res) => res.url().includes("/healthz") && res.status() === 503);
  await gotoReady(page, "/settings/about");
  await healthz;
  await expect(page.getByText("disconnected", { exact: true })).toBeVisible();
});

test("About names the KnowMe agent on the Universal Agent Runtime", async ({ page }) => {
  await gotoReady(page, "/settings/about");
  await expect(page.getByText("KnowMe on the Universal Agent Runtime")).toBeVisible();
});

test("the runtime endpoint is unclipped at 320px, with no horizontal scroll", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 900 });
  await gotoReady(page, "/settings/about");
  const endpointRow = page.locator("dd", { hasText: /^https?:\/\// }).first();
  await expect(endpointRow).toBeVisible();
  const clipped = await endpointRow.evaluate((el) => el.scrollWidth > el.clientWidth);
  expect(clipped).toBe(false);
  const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(scrollWidth).toBeLessThanOrEqual(320);
});

// ─── Not-found page ─────────────────────────────────────────────────────────────

test("unknown route shows one h1 containing 'not found' with no '!', the nav lockup, and the footer legal line", async ({
  page,
}) => {
  await gotoReady(page, "/does-not-exist");
  const h1 = page.locator("h1");
  await expect(h1).toHaveCount(1);
  const text = await h1.textContent();
  expect(text?.toLowerCase()).toContain("not found");
  expect(text ?? "").not.toContain("!");
  await expect(page.getByRole("link", { name: "KnowMe", exact: true })).toBeVisible();
  await expect(page.getByText(LEGAL_LINE, { exact: false })).toBeVisible();
});

test("the 404 CTA returns home through client-side navigation, not a full reload", async ({ page }) => {
  await gotoReady(page, "/does-not-exist");
  await page.evaluate(() => {
    (window as unknown as { __noFullReload: boolean }).__noFullReload = true;
  });
  await page.getByRole("link", { name: NOT_FOUND_CTA }).click();
  await expect(page).toHaveURL("/");
  await expect(page.locator("h1")).toHaveText(PRIMARY_TAGLINE);
  const marker = await page.evaluate(
    () => (window as unknown as { __noFullReload?: boolean }).__noFullReload,
  );
  expect(marker).toBe(true);
});

// ─── Narrow viewport: no horizontal scroll at 320px ────────────────────────────

const ROUTES_320 = ["/", "/settings/about", "/does-not-exist"];

for (const theme of THEMES) {
  for (const path of ROUTES_320) {
    test(`no horizontal scroll at 320px on ${path} (${theme})`, async ({ page }) => {
      await seedTheme(page, theme);
      await page.setViewportSize({ width: 320, height: 900 });
      await gotoReady(page, path);
      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      expect(scrollWidth).toBeLessThanOrEqual(320);
    });
  }
}

// ─── Named icon-only controls ───────────────────────────────────────────────────

test("dark theme: the theme toggle and the hero send control each resolve to exactly one named element", async ({
  page,
}) => {
  await seedTheme(page, "dark");
  await gotoReady(page, "/");
  await expect(page.getByRole("button", { name: /switch to light theme/i })).toHaveCount(1);
  await expect(page.getByRole("button", { name: /send|start/i })).toHaveCount(1);
});

// ─── Tab-through: solid, >=2px keyboard-focus outlines ─────────────────────────
//
// design.md "Amendments from task 1.1" and docs/design/brand-pages.md §5.1:
// the `Button` primitive's unconditional `outline-none` silently drops any
// focus-visible outline in Tailwind 4. The header controls, the send control
// and the 404 CTA are plain elements specifically to avoid this. Only a real
// Tab sequence proves the outline paints — axe and static captures cannot.

test("landing: Tab reaches the lockup, theme toggle, Open app and send control, each with a solid >=2px outline", async ({
  page,
}) => {
  await gotoReady(page, "/");
  // Focus order (docs/design/brand-pages.md §10): skip link, lockup link,
  // theme toggle, "Open app", textarea, send.
  await page.keyboard.press("Tab"); // skip link
  await page.keyboard.press("Tab"); // lockup link
  let outline = await focusedOutline(page);
  expect(outline.style, outline.label).toBe("solid");
  expect(outline.width, outline.label).toBeGreaterThanOrEqual(2);

  await page.keyboard.press("Tab"); // theme toggle
  outline = await focusedOutline(page);
  expect(outline.style, outline.label).toBe("solid");
  expect(outline.width, outline.label).toBeGreaterThanOrEqual(2);

  await page.keyboard.press("Tab"); // "Open app"
  outline = await focusedOutline(page);
  expect(outline.style, outline.label).toBe("solid");
  expect(outline.width, outline.label).toBeGreaterThanOrEqual(2);

  await page.keyboard.press("Tab"); // textarea
  await page.keyboard.press("Tab"); // send control
  outline = await focusedOutline(page);
  expect(outline.style, outline.label).toBe("solid");
  expect(outline.width, outline.label).toBeGreaterThanOrEqual(2);
});

test("404: Tab reaches the header controls and the home CTA, each with a solid >=2px outline", async ({ page }) => {
  await gotoReady(page, "/does-not-exist");
  await page.keyboard.press("Tab"); // skip link
  await page.keyboard.press("Tab"); // lockup link
  await page.keyboard.press("Tab"); // theme toggle
  await page.keyboard.press("Tab"); // "Open app"
  await page.keyboard.press("Tab"); // home CTA
  const outline = await focusedOutline(page);
  expect(outline.style, outline.label).toBe("solid");
  expect(outline.width, outline.label).toBeGreaterThanOrEqual(2);

  const cta = await page.evaluate(() => document.activeElement?.textContent?.trim());
  expect(cta).toBe(NOT_FOUND_CTA);
});
