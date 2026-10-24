/**
 * site-product-pages: /products and the ten product pages, on the site build
 * (VITE_SITE_AGENT_ID=knowme-site), as the other site specs run.
 * Everything after a click is the real app (router, intent store, thread
 * route, chat runtime, PGlite); only the UAR backend is the suite's mock.
 *
 *   VITE_SITE_AGENT_ID=knowme-site npx playwright test e2e/product-pages.spec.ts --project=chromium
 */
import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";
import { expect, test } from "./support/test";
import { seedTheme } from "./support/page-helpers";
import { THEMES } from "./support/routes";
import { FIXTURE_FINAL_TEXT } from "./fixtures/sse";
import { DIRECTORY } from "../content/site/directory";
import { PRODUCT_PAGES } from "../content/site/products";
import { PRODUCTS_COPY } from "../content/site/products-copy";
import { NOT_FOUND_CONTENT } from "../content/site/not-found";

test.skip(!process.env.VITE_SITE_AGENT_ID, "The product pages exist only on the site build (set VITE_SITE_AGENT_ID).");

const BOSS = PRODUCT_PAGES[0];
const FAMILY = DIRECTORY.families[2];
const AUDITED = ["/products", "/products/the-boss", "/products/flint-platform", "/products/locus"];

async function ready(page: Page) {
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await page.waitForLoadState("networkidle");
  await page.evaluate(() => document.fonts.ready);
}

test("from the front page a tile link opens its product page, and a question chip opens a thread with that question first", async ({
  page,
}) => {
  await page.goto("/");
  await ready(page);
  await page.locator(`[data-directory-lead="${BOSS.slug}"] a`).click();

  await expect(page).toHaveURL(new RegExp(`/products/${BOSS.slug}$`));
  await expect(page.getByRole("heading", { level: 1, name: BOSS.name })).toBeVisible();
  await expect(page).toHaveTitle(`${BOSS.name} · KnowMe AI, LLC`);
  await page.waitForLoadState("networkidle");

  const question = BOSS.questions[1];
  await page.getByRole("button", { name: question }).click();

  await expect(page).toHaveURL(/\/threads\/[0-9a-f-]{36}$/);
  await expect(page.getByText(question, { exact: true }).first()).toBeVisible();
  await expect(page.getByText(FIXTURE_FINAL_TEXT).first()).toBeVisible();
  const text = await page.locator("main").innerText();
  expect(text.indexOf(question)).toBeGreaterThanOrEqual(0);
  expect(text.indexOf(question)).toBeLessThan(text.indexOf(FIXTURE_FINAL_TEXT));
});

test("the inline composer sends what was typed as the first message", async ({ page }) => {
  await page.goto(`/products/${BOSS.slug}`);
  await ready(page);
  const typed = "Does The Boss run on Linux?";
  await page.getByRole("textbox", { name: `Ask about ${BOSS.name}` }).fill(typed);
  await page.getByRole("button", { name: "Ask", exact: true }).click();
  await expect(page).toHaveURL(/\/threads\/[0-9a-f-]{36}$/);
  await expect(page.getByText(typed, { exact: true }).first()).toBeVisible();
  await expect(page.getByText(FIXTURE_FINAL_TEXT).first()).toBeVisible();
});

test("an unknown product slug shows the not-found page, not a product", async ({ page }) => {
  await page.goto("/products/no-such-product");
  await expect(page.getByRole("heading", { level: 1, name: NOT_FOUND_CONTENT.heading })).toBeVisible();
  await expect(page.getByRole("heading", { name: PRODUCTS_COPY.questionsHeading })).toHaveCount(0);
  await expect(page.getByText("/products/no-such-product")).toBeVisible();
});

test("the family filter keeps its choice in the URL and survives a reload", async ({ page }) => {
  await page.goto("/products");
  await ready(page);
  const total = String(DIRECTORY.total);
  await expect(page.getByRole("status")).toHaveText(`Showing ${total} of ${total}`);

  const button = page
    .getByRole("group", { name: PRODUCTS_COPY.filterGroupLabel })
    .getByRole("button", { name: new RegExp(`^${FAMILY.name}`) });
  await button.click();
  await expect(page).toHaveURL(new RegExp(`\\?family=${FAMILY.slug}$`));
  await expect(button).toHaveAttribute("aria-pressed", "true");
  await expect(button).toBeFocused();
  const count = FAMILY.leads.reduce((n, l) => n + l.entries.length, 0) + FAMILY.rest.length;
  await expect(page.getByRole("status")).toHaveText(`Showing ${count} of ${total}`);
  // The other families stay in the HTML, hidden.
  await expect(page.locator("section[id][hidden]")).toHaveCount(DIRECTORY.families.length - 1);

  await page.reload();
  await ready(page);
  await expect(page.getByRole("status")).toHaveText(`Showing ${count} of ${total}`);
  await expect(page.getByRole("heading", { level: 2, name: new RegExp(`^${FAMILY.name}`) })).toBeVisible();
});

test("the labels key is reachable at /products#labels", async ({ page }) => {
  await page.goto("/products#labels");
  await ready(page);
  await expect(page.getByRole("heading", { level: 2, name: PRODUCTS_COPY.labelsHeading })).toBeInViewport();
});

test("keyboard order on a product page follows the page, header first", async ({ page }) => {
  await page.goto(`/products/${BOSS.slug}`);
  await ready(page);
  const names: string[] = [];
  for (let i = 0; i < 16; i++) {
    await page.keyboard.press("Tab");
    names.push(
      await page.evaluate(() => {
        const el = document.activeElement as HTMLElement | null;
        return (
          el?.getAttribute("aria-label") || el?.textContent?.trim() || el?.getAttribute("placeholder") || el?.tagName || ""
        );
      }),
    );
  }
  const at = (needle: string) => names.findIndex((n) => n.startsWith(needle));
  const order = [
    "Skip to content",
    "KnowMe",
    PRODUCTS_COPY.navLabel, // header
    "Ask the concierge",
    "Switch to",
    PRODUCTS_COPY.breadcrumbRoot, // breadcrumb, after the header's own Products link
    ...BOSS.questions,
    `Ask about ${BOSS.name}`,
  ];
  const positions: number[] = [];
  let from = 0;
  for (const needle of order) {
    const index = names.findIndex((n, i) => i >= from && n.startsWith(needle));
    expect(index, `"${needle}" not found after position ${from} in ${JSON.stringify(names)}`).toBeGreaterThanOrEqual(0);
    positions.push(index);
    from = index + 1;
  }
  expect(positions).toEqual([...positions].sort((a, b) => a - b));
  expect(at("Ask")).toBeGreaterThanOrEqual(0);
});

for (const width of [320, 1440]) {
  for (const theme of THEMES) {
    for (const path of AUDITED) {
      test(`${path} at ${width}px in ${theme}: no overflow, 44px targets, one h1, no axe violations`, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 });
        await seedTheme(page, theme);
        await page.goto(path);
        await ready(page);

        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
        );
        expect(overflow).toBeLessThanOrEqual(0);
        await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);

        const small = await page.evaluate(() =>
          [...document.querySelectorAll<HTMLElement>("main a, main button, header a, header button, main input")]
            .filter((el) => el.getClientRects().length > 0 && !el.closest("[hidden]") && !el.closest(".sr-only"))
            .map((el) => ({
              name: (el.getAttribute("aria-label") || el.textContent || el.tagName).trim().slice(0, 40),
              h: Math.round(el.getBoundingClientRect().height),
              w: Math.round(el.getBoundingClientRect().width),
            }))
            .filter((r) => r.h < 43.5 || r.w < 43.5),
        );
        expect(small, `targets under 44px: ${JSON.stringify(small)}`).toEqual([]);

        const results = await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
          .exclude("[data-slot='knowme-wordmark']")
          .analyze();
        expect(results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(" | ")}`)).toEqual([]);
      });
    }
  }
}
