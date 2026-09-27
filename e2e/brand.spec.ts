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
    // The lockup names the link, so "KnowMe" is announced once.
    const home = page.getByRole("link", { name: "KnowMe", exact: true });
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
  // Named once: the heading reads "KnowMe" and the mark beside it is decorative.
  await expect(welcome.getByRole("heading", { name: "KnowMe" })).toBeVisible();
  await expect(welcome.locator("svg[data-slot='knowme-mark'][aria-hidden='true']").first()).toBeAttached();
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

test("About names the KnowMe agent on the Universal Agent Runtime", async ({ page }) => {
  await page.goto("/settings/about");
  await expect(page.getByText("KnowMe on the Universal Agent Runtime")).toBeVisible();
  await expect(page.getByText(/Charcoal/)).toHaveCount(0);
});

test("built-in skill details credit the KnowMe agent", async ({ page }) => {
  await page.goto("/settings/skills");
  await page.getByText("KnowMe Profile", { exact: true }).first().click();
  await expect(page.getByText(/built-in skill of the KnowMe agent/)).toBeVisible();
  await expect(page.getByText(/Charcoal/)).toHaveCount(0);
});

test("brand fonts are self-hosted and load with no third-party font request", async ({ page, baseURL }) => {
  const foreignFontRequests: string[] = [];
  page.on("request", (request) => {
    const url = request.url();
    const isFont = request.resourceType() === "font" || /fonts\.(googleapis|gstatic)\.com/.test(url);
    if (isFont && !url.startsWith(baseURL ?? "")) foreignFontRequests.push(url);
  });

  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  // Ask the browser to load one face from each family, then require a declared face of that
  // family whose status is "loaded". document.fonts.check() alone returns true for a family
  // that was never declared, so it can't tell "loaded" from "missing".
  const loaded = await page.evaluate(async () => {
    const families = ["Inter Variable", "Space Grotesk Variable", "Roboto Variable", "JetBrains Mono Variable"];
    await Promise.all(families.map((family) => document.fonts.load(`400 16px '${family}'`)));
    const faces = Array.from(document.fonts);
    return families.map((family) => ({
      family,
      ok: faces.some((face) => face.family.replace(/['"]/g, "") === family && face.status === "loaded"),
    }));
  });

  expect(loaded.filter((f) => !f.ok)).toEqual([]);
  expect(foreignFontRequests).toEqual([]);
});
