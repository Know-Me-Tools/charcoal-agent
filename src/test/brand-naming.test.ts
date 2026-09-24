/**
 * Product naming guard (brand-identity spec, decision D-005).
 *
 * The product is KnowMe. "Charcoal" may appear only as a persisted identifier
 * that existing local data depends on, or as the colour word. Lovable
 * scaffolding must not come back.
 */
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const SCANNED_PATHS = [
  "src",
  "e2e",
  "index.html",
  "README.md",
  "CLAUDE.md",
  "Dockerfile",
  "docker-compose.yaml",
  ".env.example",
  "vite.config.ts",
  "package.json",
  "src-tauri/tauri.conf.json",
  "src-tauri/Cargo.toml",
];

/** Persisted identifiers and colour-word uses kept on purpose. */
const ALLOWED = [
  /\bCharcoalDb\b/,
  // Storage keys and the PGlite database name.
  /charcoal-(db|pglite-migrated-v1|thread-registry|chat-messages)\b/,
  /charcoal:prompt_caching_enabled/,
  /the charcoal tile|full-bleed charcoal/, // colour word in the asset script
  /CHARCOAL_PORT/, // legacy port fallback
  /repo directory is still `charcoal-agent`/,
  /say "charcoal"/,
  /getByText\(\/Charcoal\/\)/, // e2e assertions that the name is absent
];

function trackedFiles(): string[] {
  const out = execFileSync("git", ["ls-files", "--", ...SCANNED_PATHS], { encoding: "utf8" });
  return out.split("\n").filter((f) => f && f !== "src/test/brand-naming.test.ts");
}

/** Removes only the allowed occurrences, so other names on the same line are still checked. */
function stripAllowed(line: string): string {
  return ALLOWED.reduce((rest, allowed) => rest.replace(new RegExp(allowed.source, "g"), ""), line);
}

function offendingLines(pattern: RegExp): string[] {
  return trackedFiles().flatMap((file) =>
    readFileSync(file, "utf8")
      .split("\n")
      .flatMap((line, i) =>
        pattern.test(stripAllowed(line)) ? [`${file}:${i + 1}: ${line.trim()}`] : [],
      ),
  );
}

describe("product naming", () => {
  it("uses KnowMe instead of Charcoal outside the allow-list", () => {
    expect(offendingLines(/charcoal/i)).toEqual([]);
  });

  it("has no Lovable scaffolding left", () => {
    expect(offendingLines(/lovable/i)).toEqual([]);
  });
});
