// Size gate for the production bundle (site-bundle-attribution 8.5).
//
//   npm run build && npm run size:check [dist-dir]
//
// Fails when the entry chunk (the only script index.html loads eagerly, so
// the landing page's JavaScript) is over ENTRY_BUDGET_KB gzip. Budgets are in
// kB of 1000 bytes. Recorded 2026-10-13: entry 127.6 kB after the route-level
// split; the budget sits below the 150 kB landing limit with ~12 kB headroom.
// Lower it as cuts land; it must stay under the size of the current build.
import { readFileSync } from "node:fs";
import { gzipSync } from "node:zlib";
import { join } from "node:path";

const ENTRY_BUDGET_KB = 140;

const dist = process.argv[2] ?? "dist";
const html = readFileSync(join(dist, "index.html"), "utf8");
const match = html.match(/<script[^>]+type="module"[^>]+src="\/?(assets\/[^"]+\.js)"/);
if (!match) {
  console.error(`size:check: no entry script found in ${dist}/index.html`);
  process.exit(2);
}

const kb = gzipSync(readFileSync(join(dist, match[1]))).length / 1000;
const line = `entry ${match[1]} ${kb.toFixed(1)} kB gzip (budget ${ENTRY_BUDGET_KB} kB)`;
if (kb > ENTRY_BUDGET_KB) {
  console.error(`FAIL ${line}`);
  process.exit(1);
}
console.log(`ok   ${line}`);
