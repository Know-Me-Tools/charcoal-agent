import assert from "node:assert/strict";
import { appendFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { BUNDLE, CORPUS, copyTree, runNode } from "./helpers.mjs";

const VALIDATE = "scripts/kb/validate-kb.mjs";

/** Fresh copies of the real bundle and corpus, and the args that point the validator at them. */
function copies() {
  const bundle = copyTree(BUNDLE, "vbundle");
  const corpus = copyTree(CORPUS, "vcorpus");
  return { bundle, corpus, args: ["--bundle", bundle, "--corpus", corpus] };
}

test("the real tree passes the validator", () => {
  const r = runNode(VALIDATE);
  assert.equal(r.status, 0, r.output);
  assert.match(r.stdout, /0 failure\(s\)/);
});

test("an unmodified copy passes (control for the mutation checks)", () => {
  const { args } = copies();
  const r = runNode(VALIDATE, args);
  assert.equal(r.status, 0, r.output);
});

test("mutation: a planted fake secret fails the validator", () => {
  const { corpus, args } = copies();
  // Built from fragments at runtime: no credential-shaped literal in the repo.
  const fake = ["s", "k", "-"].join("") + "Zq7".repeat(3) + "x9K".repeat(5);
  appendFileSync(join(corpus, "faq.md"), `\nThe key is ${fake}\n`);
  const r = runNode(VALIDATE, args);
  assert.equal(r.status, 1, r.output);
  assert.match(r.stderr, /faq\.md:\d+: possible secret or personal data: API key prefix/);
});

test("mutation: a planted home-directory path fails the validator", () => {
  const { bundle, args } = copies();
  const home = "/" + "Us" + "ers" + "/" + "someone/notes.md";
  appendFileSync(join(bundle, "log.md"), `\n* Copied from ${home}\n`);
  const r = runNode(VALIDATE, args);
  assert.equal(r.status, 1, r.output);
  assert.match(r.stderr, /log\.md:\d+: possible secret or personal data: absolute home-directory path/);
});

test("mutation: a planted banned assertion fails; negated and mandated sentences pass", () => {
  const ok = copies();
  appendFileSync(
    join(ok.corpus, "knowme-overview.md"),
    "\nKnowMe is not HIPAA compliant. Pricing has not been announced. KnowMe is browser-certified on synthetic data only.\n",
  );
  const pass = runNode(VALIDATE, ok.args);
  assert.equal(pass.status, 0, pass.output);

  const bad = copies();
  appendFileSync(join(bad.corpus, "knowme-overview.md"), "\nKnowMe is HIPAA compliant and costs $9 a month.\n");
  const r = runNode(VALIDATE, bad.args);
  assert.equal(r.status, 1, r.output);
  assert.match(r.stderr, /knowme-overview\.md:\d+: banned assertion, HIPAA claim/);
  assert.match(r.stderr, /knowme-overview\.md:\d+: banned assertion, price amount/);
});

test("mutation: a missing FR-8 file fails the validator", () => {
  for (const name of ["the-boss.md", "ipfs-sync-for-obsidian.md"]) {
    const { corpus, args } = copies();
    rmSync(join(corpus, name));
    const r = runNode(VALIDATE, args);
    assert.equal(r.status, 1, r.output);
    assert.match(r.stderr, new RegExp(`${name.replace(/\./g, "\\.")}:0: missing: the seed's FR-8 checks need this file`));
  }
});

test("mutation: a concept without `type` fails the validator", () => {
  const { bundle, args } = copies();
  writeFileSync(
    join(bundle, "knowme", "no-type.md"),
    [
      "---",
      "title: No type",
      "description: A concept missing its type.",
      "status: draft",
      "generated:",
      "  by: test/1",
      '  at: "2026-10-12T00:00:00+00:00"',
      "---",
      "",
      "# No type",
      "",
    ].join("\n"),
  );
  const r = runNode(VALIDATE, args);
  assert.equal(r.status, 1, r.output);
  assert.match(r.stderr, /no-type\.md:1: frontmatter `type` is required/);
});

test("mutation: an external claim without a dated public source fails the validator", () => {
  const { bundle, args } = copies();
  writeFileSync(
    join(bundle, "landscape", "claim.md"),
    [
      "---",
      "type: Concept",
      "title: A claim",
      "description: An external claim.",
      "status: draft",
      "generated:",
      "  by: test/1",
      '  at: "2026-10-12T00:00:00+00:00"',
      "sources:",
      "  - id: a",
      "    resource: https://example.com/a",
      "---",
      "",
      "Another tool stores notes locally.[^a] It also syncs.[^b]",
      "",
    ].join("\n"),
  );
  const r = runNode(VALIDATE, args);
  assert.equal(r.status, 1, r.output);
  assert.match(r.stderr, /claim\.md:1: source a: needs a retrieval date/);
  assert.match(r.stderr, /claim\.md:14: external claim \[\^b\] has no matching `sources` entry/);
});
