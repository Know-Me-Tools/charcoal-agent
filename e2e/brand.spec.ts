/**
 * brand-identity spec: the KnowMe lockup on every app route, the mark in the
 * chat welcome, and the legal line.
 */
import { expect, test } from "./support/test";

const APP_PATHS = ["/threads", "/agents", "/settings/providers", "/settings/about"];

for (const path of APP_PATHS) {
  test(`top bar shows the KnowMe lockup on ${path}`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(path);
    const home = page.getByRole("link", { name: "KnowMe home" });
    await expect(home).toBeVisible();
    await expect(home.getByRole("img", { name: "KnowMe" })).toBeVisible();
    await expect(home.locator("svg circle")).toHaveAttribute("fill", "var(--km-ember)");
  });
}

test("chat welcome shows the KnowMe mark instead of a generic icon", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/threads/0b6c3a8e-7d2f-4c1a-9e5b-3f8d2a1c4e70");
  const welcome = page.locator(".aui-thread-root");
  await expect(welcome.locator("svg[data-slot='knowme-mark']").first()).toBeVisible();
  await expect(welcome.locator(".lucide-sparkles")).toHaveCount(0);
});

test("landing footer and About show the legal line", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("© 2026 KnowMe AI, LLC", { exact: false })).toBeVisible();
  await page.goto("/settings/about");
  await expect(page.getByText("© 2026 KnowMe AI, LLC")).toBeVisible();
});

test("head metadata uses KnowMe identity and self-hosted assets", async ({ page, baseURL }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/KnowMe/);
  const meta = async (sel: string) => page.locator(sel).getAttribute("content");
  expect(await meta('meta[property="og:title"]')).toBe("KnowMe");
  expect(await meta('meta[property="og:description"]')).toBe("AI that understands you.");
  expect(await meta('meta[name="twitter:description"]')).toBe("AI that understands you.");

  for (const sel of ['meta[property="og:image"]', 'meta[name="twitter:image"]']) {
    const url = new URL((await meta(sel)) ?? "", baseURL);
    expect(url.origin, sel).toBe(new URL(baseURL!).origin);
    const res = await page.request.get(url.href);
    expect(res.headers()["content-type"]).toContain("image/png");
  }
  for (const href of ["/favicon.svg", "/favicon.ico", "/apple-touch-icon.png"]) {
    await expect(page.locator(`link[href="${href}"]`)).toHaveCount(1);
    expect((await page.request.get(href)).ok(), href).toBe(true);
  }
});
