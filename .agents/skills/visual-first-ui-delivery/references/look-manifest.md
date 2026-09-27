# Look manifest

Write this for every UI change, at `docs/qa/look/<change-id>.md`. It is the evidence that someone looked.

```markdown
# Look manifest: <change-id>
Reviewer: <name or agent id>   Brand references: <paths, or "tokens + last approved screens">

| Image | Route | Width | Theme | Observation |
|---|---|---|---|---|
| test-results/look/agents__320__light.png | agents | 320 | light | Cards stack; chips visible on surface; no overlap or clipping. |
| test-results/look/agents__320__dark.png | agents | 320 | dark | ... |
```

## The check (fails the handoff)

```js
// scripts/check-look-manifest.mjs <change-id> <route,route,...>
import { readFileSync, existsSync } from "node:fs";
const [id, routesArg] = process.argv.slice(2);
const path = `docs/qa/look/${id}.md`;
if (!existsSync(path)) { console.error(`missing ${path}`); process.exit(1); }
const rows = readFileSync(path, "utf8").split("\n").filter((l) => l.startsWith("| test-results"));
const need = routesArg.split(",").flatMap((r) => [320, 1440].flatMap((w) => ["light", "dark"].map((t) => `${r}|${w}|${t}`)));
const have = new Set(rows.map((l) => l.split("|").map((c) => c.trim())).filter((c) => c[5] && c[5].length > 10).map((c) => `${c[2]}|${c[3]}|${c[4]}`));
const missing = need.filter((k) => !have.has(k));
for (const r of rows) { const img = r.split("|")[1].trim(); if (!existsSync(img)) missing.push(`image not found: ${img}`); }
if (missing.length) { console.error("look manifest incomplete:\n" + missing.join("\n")); process.exit(1); }
console.log(`look manifest ok: ${have.size} observations`);
```

Put it in the pre-handoff command, or as a CI step on UI pull requests, with the touched routes derived from the diff.
