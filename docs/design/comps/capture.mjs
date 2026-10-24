// Captures the comps at 320 and 1440 px, light and dark, into docs/design/comps/shots/.
// Serves the repository root on its own port (not the app's 4174) and reports any
// element that overflows the viewport horizontally.
//
//   node docs/design/comps/capture.mjs        (from a checkout with node_modules)

import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, "../../..");
const PORT = 4391;
const PAGES = ["home-directory", "product-the-boss", "products"];
const WIDTHS = [320, 1440];
const THEMES = ["light", "dark"];

const server = spawn("python3", ["-m", "http.server", String(PORT), "--bind", "127.0.0.1"], { cwd: repo, stdio: "ignore" });
await new Promise((r) => setTimeout(r, 800));

// COMP_CHROMIUM points at any local Chromium when the pinned Playwright build is not
// downloaded (this script never installs one).
const browser = await chromium.launch(process.env.COMP_CHROMIUM ? { executablePath: process.env.COMP_CHROMIUM } : {});
let failures = 0;
try {
	for (const name of PAGES) {
		for (const width of WIDTHS) {
			for (const theme of THEMES) {
				const page = await browser.newPage({ viewport: { width, height: 900 }, deviceScaleFactor: 1 });
				const url = `http://127.0.0.1:${PORT}/docs/design/comps/${name}.html?theme=${theme}`;
				const res = await page.goto(url, { waitUntil: "networkidle" });
				if (!res || !res.ok()) throw new Error(`${url} -> ${res && res.status()}`);
				await page.evaluate(() => document.fonts.ready);
				const report = await page.evaluate(() => {
					function* ancestors(el) {
						for (let a = el.parentElement; a && a !== document.body; a = a.parentElement) yield a;
					}
					const vw = document.documentElement.clientWidth;
					const fonts = [...document.fonts].filter((f) => f.status === "loaded").map((f) => f.family);
					const over = [...document.querySelectorAll("body *")]
						.filter((el) => {
							const r = el.getBoundingClientRect();
							return r.width > 0 && (r.right > vw + 0.5 || r.left < -0.5);
						})
						.filter((el) => !el.closest(".sr-only"))
						// Children of a container that scrolls inside itself are clipped, not overflow.
						.filter((el) => !el.parentElement.closest("*") || ![...ancestors(el)].some((a) => getComputedStyle(a).overflowX === "auto"))
						.slice(0, 5)
						.map((el) => `${el.tagName.toLowerCase()}.${el.className} right=${Math.round(el.getBoundingClientRect().right)}`);
					return { vw, scroll: document.documentElement.scrollWidth, fonts: [...new Set(fonts)], over };
				});
				const file = path.join(here, "shots", `${name}-${width}-${theme}.png`);
				await page.screenshot({ path: file, fullPage: true });
				const ok = report.scroll <= report.vw && report.over.length === 0;
				if (!ok) failures++;
				console.log(`${ok ? "ok  " : "FAIL"} ${name} ${width} ${theme} scrollWidth=${report.scroll}/${report.vw} fonts=${report.fonts.join(",")} ${report.over.join(" | ")}`);
				await page.close();
			}
		}
	}
} finally {
	await browser.close();
	server.kill();
}
process.exit(failures ? 1 : 0);
