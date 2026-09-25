/**
 * app-shell spec: navigation state treatment, persistent runtime status, skip
 * navigation, and Flat 2.0 surfaces (fill-separated regions, no borders or
 * shadows, nothing below 12px).
 */
import type { Page } from "@playwright/test";
import { FIXTURE_THREAD_ID } from "./support/routes";
import { expect, test } from "./support/test";

const DESTINATIONS = [
  { path: "/threads", active: "Threads" },
  { path: "/agents", active: "Agents" },
  { path: "/settings/providers", active: "Settings" },
] as const;
const LABELS = ["Threads", "Agents", "Settings"];

for (const { path, active } of DESTINATIONS) {
  test(`top bar marks ${active} as the active destination on ${path}`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(path);
    const nav = page.getByRole("navigation", { name: "Main" });
    for (const label of LABELS) {
      const link = nav.getByRole("link", { name: label, exact: true });
      if (label === active) {
        await expect(link).toHaveAttribute("aria-current", "page");
        await expect(link).toHaveClass(/\bbg-ember-soft\b/);
      } else {
        await expect(link).not.toHaveAttribute("aria-current");
      }
    }
  });
}

test("bottom navigation marks the active destination on phones", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto("/agents");
  const nav = page.getByRole("navigation", { name: "Main" });
  await expect(nav.getByRole("link", { name: "Agents" })).toHaveAttribute("aria-current", "page");
  await expect(nav.getByRole("link", { name: "Threads" })).not.toHaveAttribute("aria-current");
});

test("runtime status is visible in the top bar on every desktop route", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  for (const path of ["/agents", "/settings/providers"]) {
    await page.goto(path);
    const status = page.getByRole("banner").getByRole("status");
    await expect(status).toHaveText("Connected");
    await expect(status).toHaveAccessibleName(/runtime connected/i);
  }
});

test("first Tab reaches a skip link that moves focus to the main content", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/agents");
  await expect(page.getByText("Research Analyst").first()).toBeVisible();
  await page.keyboard.press("Tab");
  const skip = page.getByRole("link", { name: "Skip to content" });
  await expect(skip).toBeFocused();
  await expect(skip).toBeVisible();
  await page.keyboard.press("Enter");
  await expect(page.locator("main#main")).toBeFocused();
});

test("icon-only controls in the top bar are named", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/threads");
  await expect(page.getByRole("banner").getByRole("button", { name: /switch to (light|dark) theme/i })).toBeVisible();
});

test("shell regions separate by fill with no borders, shadows or sub-12px text", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/threads");
  await expect(page.getByRole("complementary", { name: "Threads" })).toBeVisible();
  const report = await page.evaluate(() => {
    const token = (name: string) => {
      const probe = document.createElement("div");
      probe.style.backgroundColor = `var(${name})`;
      document.body.append(probe);
      const value = getComputedStyle(probe).backgroundColor;
      probe.remove();
      return value;
    };
    const bg = (el: Element | null) => (el ? getComputedStyle(el).backgroundColor : "missing");
    const shell = [
      document.querySelector("header"),
      document.querySelector("aside[aria-label='Threads']"),
      document.querySelector("nav[aria-label='Main']"),
    ].filter((el): el is Element => el !== null);
    const offenders: string[] = [];
    for (const root of shell) {
      for (const el of [root, ...Array.from(root.querySelectorAll("*"))]) {
        const s = getComputedStyle(el);
        const bordered = ["Top", "Right", "Bottom", "Left"].some(
          (side) =>
            parseFloat(s.getPropertyValue(`border-${side.toLowerCase()}-width`)) > 0 &&
            s.getPropertyValue(`border-${side.toLowerCase()}-color`) !== "rgba(0, 0, 0, 0)",
        );
        if (bordered) offenders.push(`border: ${el.tagName}.${el.className}`);
        if (s.boxShadow !== "none" && !el.matches(":focus-visible")) offenders.push(`shadow: ${el.tagName}`);
        if (s.backdropFilter !== "none" && s.backdropFilter !== "") offenders.push(`blur: ${el.tagName}`);
        const hasText = Array.from(el.childNodes).some((n) => n.nodeType === Node.TEXT_NODE && n.textContent?.trim());
        if (hasText && parseFloat(s.fontSize) < 12) offenders.push(`${s.fontSize}: ${el.textContent?.trim()}`);
      }
    }
    return {
      offenders,
      header: bg(document.querySelector("header")),
      sidebar: bg(document.querySelector("aside[aria-label='Threads']")),
      main: bg(document.querySelector("main")),
      chrome: token("--km-chrome"),
      canvas: token("--km-canvas"),
    };
  });
  expect(report.offenders).toEqual([]);
  expect(report.header).toBe(report.chrome);
  expect(report.sidebar).toBe(report.chrome);
  expect(report.main).toBe(report.canvas);
});

/** Open the fixture thread and send one message so it is persisted and listed. */
async function openPersistedThread(page: Page): Promise<void> {
  await page.goto(`/threads/${FIXTURE_THREAD_ID}`);
  const composer = page.getByPlaceholder(/Ask your agent anything/i).filter({ visible: true });
  await composer.fill("Plan my week around the rebrand launch.");
  await composer.press("Enter");
}

test("the open thread is marked active in the sidebar without a border", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openPersistedThread(page);
  const active = page.getByRole("complementary", { name: "Threads" }).locator("[aria-current='page']");
  await expect(active).toHaveCount(1);
  await expect(active).toHaveClass(/\bbg-ember-soft\b/);
  // No visible left rule: either no width or a transparent colour.
  const leftRule = await active.evaluate((el) => {
    const s = getComputedStyle(el);
    return { width: parseFloat(s.borderLeftWidth), color: s.borderLeftColor };
  });
  expect(leftRule.width === 0 || leftRule.color === "rgba(0, 0, 0, 0)").toBe(true);
});

for (const width of [768, 1024]) {
  test(`conversation keeps at least 480px at ${width}px; context opens as a sheet`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(`/threads/${FIXTURE_THREAD_ID}`);
    const main = page.locator("main#main");
    await expect(main).toBeVisible();
    expect((await main.boundingBox())?.width ?? 0).toBeGreaterThanOrEqual(480);
    await expect(page.getByRole("complementary", { name: "Context" })).toHaveCount(0);

    await page.getByRole("button", { name: "Toggle context panel" }).click();
    const sheet = page.getByRole("dialog", { name: "Context" });
    await expect(sheet).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(sheet).toHaveCount(0);
  });
}

test("context panel is inline at 1440px", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`/threads/${FIXTURE_THREAD_ID}`);
  const panel = page.getByRole("complementary", { name: "Context" });
  await expect(panel).toBeVisible();
  const { panelBg, surface } = await panel.evaluate((el) => {
    const probe = document.createElement("div");
    probe.style.backgroundColor = "var(--km-surface)";
    document.body.append(probe);
    const surface = getComputedStyle(probe).backgroundColor;
    probe.remove();
    return { panelBg: getComputedStyle(el).backgroundColor, surface };
  });
  expect(panelBg).toBe(surface);
});

test("phone thread drawer is a dismissible sheet", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto("/threads");
  await page.getByRole("button", { name: "Open threads" }).click();
  const drawer = page.getByRole("dialog", { name: "Threads" });
  await expect(drawer).toBeVisible();
  await expect(drawer.getByRole("button", { name: "New thread", exact: true })).toBeVisible();
  await drawer.getByRole("button", { name: "Close threads" }).click();
  await expect(drawer).toHaveCount(0);
});

test("sheets close when their layout goes away, so they never reopen on their own", async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 900 });
  await page.goto(`/threads/${FIXTURE_THREAD_ID}`);
  await page.getByRole("button", { name: "Toggle context panel" }).click();
  await expect(page.getByRole("dialog", { name: "Context" })).toBeVisible();
  await page.setViewportSize({ width: 1440, height: 900 });
  await expect(page.getByRole("complementary", { name: "Context" })).toBeVisible();
  await page.setViewportSize({ width: 1024, height: 900 });
  await expect(page.locator("main#main")).toBeVisible();
  await expect(page.getByRole("dialog")).toHaveCount(0);

  await page.setViewportSize({ width: 320, height: 800 });
  await page.getByRole("button", { name: "Open threads" }).click();
  await expect(page.getByRole("dialog", { name: "Threads" })).toBeVisible();
  await page.setViewportSize({ width: 1024, height: 900 });
  // Settle point: without this, the next `setViewportSize` below can land
  // before Chromium's `matchMedia` re-evaluates for this resize (it fires at
  // most once per rendering opportunity), so the two calls net to no change
  // and `isMobile` never toggles — a state no real user can produce, since a
  // real resize always has a paint in between. "Open threads" is gated on
  // `isMobile` (`topbar.tsx`, `useIsMobile` → `(max-width: 767px)`), so its
  // absence proves the wide layout actually committed before shrinking back.
  await expect(page.getByRole("button", { name: "Open threads" })).toHaveCount(0);
  await page.setViewportSize({ width: 320, height: 800 });
  await expect(page.getByRole("button", { name: "Open threads" })).toBeVisible();
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

test("the context sheet closes when the route changes", async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 900 });
  await page.goto("/agents");
  await page.goto(`/threads/${FIXTURE_THREAD_ID}`);
  await page.getByRole("button", { name: "Toggle context panel" }).click();
  await expect(page.getByRole("dialog", { name: "Context" })).toBeVisible();
  await page.goBack();
  await page.goForward();
  await expect(page.locator("main#main")).toBeVisible();
  await expect(page.getByRole("dialog")).toHaveCount(0);
});
