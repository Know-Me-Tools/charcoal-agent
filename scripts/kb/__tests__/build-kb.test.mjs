import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync, symlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { BUNDLE, CORPUS, copyTree, hashDir, runNode, tempDir } from "./helpers.mjs";

const BUILD = "scripts/kb/build-kb.mjs";

const CONCEPT = `---
type: Concept
title: "The Boss: platforms"
description: Which operating systems The Boss runs on.
status: draft
generated:
  by: test/1
  at: "2026-10-12T00:00:00+00:00"
sources:
  - id: rel
    resource: https://example.com/the-boss/releases
    title: The Boss release notes
    last_modified: "2026-10-01T00:00:00+00:00"
---

# Platforms

The Boss runs on Windows and macOS.[^rel]

## Installers

Installers are listed on the release page.[^rel] Use \`[^rel]\` literally in code.

[^rel]: The Boss release notes.
`;

/** A temp bundle with one extra concept, a temp corpus copy and a manifest. */
function fixture(entries) {
  const bundle = copyTree(BUNDLE, "bundle");
  writeFileSync(join(bundle, "the-boss", "the-boss-platforms.md"), CONCEPT);
  const corpus = copyTree(CORPUS, "corpus");
  const manifest = join(tempDir("manifest"), "build-manifest.json");
  writeFileSync(manifest, JSON.stringify({ entries }));
  const args = ["--manifest", manifest, "--source-dir", bundle, "--out-dir", corpus];
  return { bundle, corpus, manifest, args };
}

test("an empty manifest leaves content/knowledge byte-identical", () => {
  // Runs on a temp copy with an explicitly empty manifest, so the test keeps
  // holding once the committed manifest lists real concepts.
  const { corpus, args } = fixture([]);
  const before = hashDir(corpus);
  const r = runNode(BUILD, args);
  assert.equal(r.status, 0, r.output);
  assert.deepEqual(hashDir(corpus), before);
  assert.equal(runNode(BUILD, ["--check", ...args]).status, 0);
});

test("a manifest build writes only the listed file and never touches the FR-8 files", () => {
  const { corpus, args } = fixture([{ source: "the-boss/the-boss-platforms.md", output: "the-boss-platforms.md" }]);
  const before = hashDir(corpus);
  const r = runNode(BUILD, args);
  assert.equal(r.status, 0, r.output);
  const after = hashDir(corpus);
  assert.deepEqual(Object.keys(after).sort(), [...Object.keys(before), "the-boss-platforms.md"].sort());
  for (const [name, hash] of Object.entries(before)) assert.equal(after[name], hash, `${name} changed`);

  const out = readFileSync(join(corpus, "the-boss-platforms.md"), "utf8");
  assert.equal(
    out,
    [
      "# Platforms (The Boss)",
      "",
      "The Boss runs on Windows and macOS.",
      "",
      "Source: The Boss release notes, retrieved 2026-10-01.",
      "",
      "## Installers (The Boss)",
      "",
      "Installers are listed on the release page. Use `[^rel]` literally in code.",
      "",
      "Source: The Boss release notes, retrieved 2026-10-01.",
      "",
    ].join("\n"),
  );

  assert.equal(runNode(BUILD, ["--check", ...args]).status, 0, "--check passes right after a build");
  writeFileSync(join(corpus, "the-boss-platforms.md"), `${out}edited\n`);
  const check = runNode(BUILD, ["--check", ...args]);
  assert.equal(check.status, 1, "--check fails when an output differs");
  assert.match(check.stderr, /out of date: the-boss-platforms\.md/);
});

test("the build refuses to overwrite an unlisted existing file", () => {
  // A name that differs only by case would overwrite the unlisted file on a
  // case-insensitive file system.
  const caseFix = fixture([{ source: "the-boss/the-boss-platforms.md", output: "the-notes.md" }]);
  writeFileSync(join(caseFix.corpus, "The-Notes.md"), "hand-authored\n");
  const before = hashDir(caseFix.corpus);
  const r = runNode(BUILD, caseFix.args);
  assert.equal(r.status, 1, r.output);
  assert.match(r.stderr, /refusing to overwrite unlisted existing file The-Notes\.md/);
  assert.deepEqual(hashDir(caseFix.corpus), before);

  // A symbolic link at the output path would write through to another file.
  const linkFix = fixture([{ source: "the-boss/the-boss-platforms.md", output: "linked.md" }]);
  symlinkSync(join(linkFix.corpus, "the-boss.md"), join(linkFix.corpus, "linked.md"));
  const bossBefore = readFileSync(join(linkFix.corpus, "the-boss.md"), "utf8");
  const r2 = runNode(BUILD, linkFix.args);
  assert.equal(r2.status, 1, r2.output);
  assert.match(r2.stderr, /refusing to write through a symbolic link/);
  assert.equal(readFileSync(join(linkFix.corpus, "the-boss.md"), "utf8"), bossBefore);

  // An output outside a flat lowercase name is rejected before anything is written.
  const escapeFix = fixture([{ source: "the-boss/the-boss-platforms.md", output: "../the-boss.md" }]);
  const r3 = runNode(BUILD, escapeFix.args);
  assert.equal(r3.status, 1, r3.output);
  assert.match(r3.stderr, /output must be a flat lowercase file name/);
});

test("the build is deterministic", () => {
  const a = fixture([{ source: "the-boss/the-boss-platforms.md", output: "the-boss-platforms.md" }]);
  const b = fixture([{ source: "the-boss/the-boss-platforms.md", output: "the-boss-platforms.md" }]);
  assert.equal(runNode(BUILD, a.args).status, 0);
  assert.equal(runNode(BUILD, b.args).status, 0);
  assert.deepEqual(hashDir(a.corpus), hashDir(b.corpus));
  const again = runNode(BUILD, a.args);
  assert.equal(again.status, 0);
  assert.match(again.stdout, /1 manifest output\(s\), 0 written/);
  assert.ok(existsSync(join(a.corpus, "the-boss-platforms.md")));
  assert.equal(readdirSync(a.corpus).length, readdirSync(CORPUS).length + 1);
});
