// Cross-platform `npm run test:a11y`: clean old results, run the axe spec,
// merge the report, and exit with Playwright's status.
import { spawnSync } from "node:child_process";

const node = process.execPath;
const run = (cmd, args) => spawnSync(cmd, args, { stdio: "inherit", shell: process.platform === "win32" });

run(node, ["e2e/support/a11y-report.mjs", "--clean"]);
const playwright = run("npx", ["playwright", "test", "e2e/a11y.spec.ts", ...process.argv.slice(2)]);
run(node, ["e2e/support/a11y-report.mjs"]);
process.exit(playwright.status ?? 1);
