#!/usr/bin/env node
/**
 * Regenerate KnowMe brand assets from the committed sources in scripts/brand/.
 *   npm run brand:assets
 * Requires rsvg-convert, ImageMagick (magick), cargo-tauri and Playwright's
 * Chromium. Outputs are committed, so normal builds need none of these.
 */
import { execFileSync } from "node:child_process";
import { copyFileSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { chromium } from "@playwright/test";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const src = (f) => path.join(root, "scripts/brand", f);
const pub = (f) => path.join(root, "public", f);
const run = (cmd, args) => execFileSync(cmd, args, { stdio: "inherit" });
const tmp = mkdtempSync(path.join(tmpdir(), "knowme-brand-"));

try {
  const icon = src("app-icon.svg");

  // Browser tab: SVG favicon (the charcoal tile reads on light and dark tabs).
  copyFileSync(icon, pub("favicon.svg"));

  // Legacy .ico with 16/32/48 px layers.
  const sizes = [16, 32, 48].map((s) => {
    const out = path.join(tmp, `fav-${s}.png`);
    run("rsvg-convert", ["-w", String(s), "-h", String(s), icon, "-o", out]);
    return out;
  });
  run("magick", [...sizes, pub("favicon.ico")]);

  // Apple touch icon: full-bleed charcoal (iOS applies its own rounding).
  const touch = path.join(tmp, "touch.png");
  run("rsvg-convert", ["-w", "180", "-h", "180", icon, "-o", touch]);
  run("magick", [touch, "-background", "#0B0F14", "-flatten", pub("apple-touch-icon.png")]);

  // Desktop (Tauri) icons from a 1024 px render.
  const big = path.join(tmp, "app-icon-1024.png");
  run("rsvg-convert", ["-w", "1024", "-h", "1024", icon, "-o", big]);
  run("cargo", ["tauri", "icon", big, "-o", path.join(root, "src-tauri/icons")]);

  // Social preview (1200×630) rendered with the brand fonts.
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
  await page.goto(pathToFileURL(src("og-image.html")).href);
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: pub("og-image.png") });
  await browser.close();

  console.log("Brand assets written to public/ and src-tauri/icons/");
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
