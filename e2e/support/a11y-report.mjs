// Merge per-route axe results into test-results/a11y-report.json and print a summary.
import fs from "node:fs";
import path from "node:path";

const dir = path.resolve("test-results/a11y");

// `--clean` runs before the scan so the merged report only reflects this run.
if (process.argv.includes("--clean")) {
  fs.rmSync(dir, { recursive: true, force: true });
  process.exit(0);
}
const files = fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => f.endsWith(".json")) : [];
const all = files.flatMap((f) => JSON.parse(fs.readFileSync(path.join(dir, f), "utf8")).violations);
const byRule = {};
for (const v of all) {
  byRule[v.rule] ??= { impact: v.impact, pages: 0, nodes: 0, help: v.help };
  byRule[v.rule].pages += 1;
  byRule[v.rule].nodes += v.nodes;
}
fs.writeFileSync(
  path.resolve("test-results/a11y-report.json"),
  JSON.stringify({ generatedAt: new Date().toISOString(), scans: files.length, byRule, violations: all }, null, 2),
);
console.log(`axe: ${files.length} scans, ${all.length} violations across ${Object.keys(byRule).length} rules`);
for (const [rule, s] of Object.entries(byRule)) {
  console.log(`  ${rule} [${s.impact}] ${s.pages} page/theme(s), ${s.nodes} node(s) — ${s.help}`);
}
