import assert from "node:assert/strict";
import { appendFileSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { resolvePlaceholders } from "../lib/product-facts.mjs";
import { BUNDLE, CORPUS, copyTree, runNode, tempDir } from "./helpers.mjs";

const facts = new Map([
	["uar", { id: "uar", version: { kind: "stable", value: "v1.2.3", date: "2026-10-23", preRelease: { value: "v1.3.0" } }, deployed: { value: "v1.3.0" } }],
	["demos", { id: "demos", version: { kind: "untagged", lastCommit: "2026-10-21" } }],
	["synaxis", { id: "synaxis", version: { kind: "none", note: "no repository identified" } }],
]);

test("a plain placeholder becomes the product's version", () => {
	assert.equal(resolvePlaceholders("UAR is at {{v:uar}}.", facts, "p.md").text, "UAR is at v1.2.3.");
});

test("the pre, deployed and date forms resolve", () => {
	const r = resolvePlaceholders("{{v:uar:pre}} / {{v:uar:deployed}} / {{v:uar:date}}", facts, "p.md");
	assert.deepEqual(r.errors, []);
	assert.equal(r.text, "v1.3.0 / v1.3.0 / 2026-10-23");
});

test("an untagged product reads as no tagged release with its last-commit date", () => {
	assert.equal(resolvePlaceholders("{{v:demos}}", facts, "p.md").text, "no tagged release (last commit 2026-10-21)");
});

test("an unknown product id is an error that names the page and leaves the token", () => {
	const r = resolvePlaceholders("x {{v:no-such}} y", facts, "p.md");
	assert.equal(r.text, "x {{v:no-such}} y");
	assert.match(r.errors[0], /^p\.md: \{\{v:no-such\}\} names an unknown product id$/);
});

test("a variant the row does not have is an error", () => {
	assert.match(resolvePlaceholders("{{v:demos:pre}}", facts, "p.md").errors[0], /has no value in the facts file/);
	assert.match(resolvePlaceholders("{{v:synaxis}}", facts, "p.md").errors[0], /has no value in the facts file/);
});

test("a malformed token is an error", () => {
	assert.match(resolvePlaceholders("{{v:UAR}}", facts, "p.md").errors[0], /malformed placeholder/);
});

test("placeholders without a facts file are an error, text without placeholders is untouched", () => {
	assert.match(resolvePlaceholders("{{v:uar}}", null, "p.md").errors[0], /product-facts\.json was not found/);
	assert.deepEqual(resolvePlaceholders("no tokens here", null, "p.md"), { text: "no tokens here", errors: [] });
});

const CONCEPT = `---
type: Concept
title: "Version line"
description: States a version from the facts file.
status: draft
generated:
  by: test/1
  at: "2026-10-24T00:00:00+00:00"
sources:
  - id: rel
    resource: https://example.com/releases
    title: Release notes
    last_modified: "2026-10-24T00:00:00+00:00"
---

# Version

Universal Agent Runtime is at {{v:uar}}, with {{v:uar:pre}} as a pre-release.[^rel]
`;

function workspace(conceptText) {
	const root = tempDir("placeholders");
	const bundle = copyTree(BUNDLE, "bundle");
	const corpus = copyTree(CORPUS, "corpus");
	const dir = join(bundle, "universal-agent-runtime");
	writeFileSync(join(dir, "version-line.md"), conceptText);
	const manifestPath = join(root, "manifest.json");
	const manifest = JSON.parse(readFileSync(join(BUNDLE, "build-manifest.json"), "utf8"));
	manifest.entries.push({ source: "universal-agent-runtime/version-line.md", output: "version-line.md" });
	writeFileSync(manifestPath, JSON.stringify(manifest));
	return { bundle, corpus, manifestPath };
}

const build = (w, extra = []) => runNode("scripts/kb/build-kb.mjs", ["--manifest", w.manifestPath, "--source-dir", w.bundle, "--out-dir", w.corpus, ...extra]);
const validate = (w) => runNode("scripts/kb/validate-kb.mjs", ["--bundle", w.bundle, "--corpus", w.corpus]);

test("build writes the resolved version into the generated page", () => {
	const w = workspace(CONCEPT);
	const b = build(w);
	assert.equal(b.status, 0, b.output);
	const out = readFileSync(join(w.corpus, "version-line.md"), "utf8");
	assert.match(out, /Universal Agent Runtime is at v\d+\.\d+\.\d+, with v\d+\.\d+\.\d+ as a pre-release\./);
	assert.equal(out.includes("{{"), false);
});

test("mutation: an unknown product id fails the build", () => {
	const w = workspace(CONCEPT.replace("{{v:uar}}", "{{v:no-such-product}}"));
	const b = build(w);
	assert.equal(b.status, 1, b.output);
	assert.match(b.stderr, /version-line\.md: \{\{v:no-such-product\}\} names an unknown product id/);
});

test("mutation: an unresolved placeholder in the generated corpus fails validate-kb", () => {
	const w = workspace(CONCEPT);
	assert.equal(build(w).status, 0);
	appendFileSync(join(w.corpus, "version-line.md"), "\nStill at {{v:uar}}.\n");
	const v = validate(w);
	assert.equal(v.status, 1, v.output);
	assert.match(v.stderr, /version-line\.md:\d+: unresolved \{\{v:\.\.\.\}\} version placeholder/);
});

test("mutation: an unknown placeholder in a source page fails validate-kb", () => {
	const w = workspace(CONCEPT.replace("{{v:uar}}", "{{v:no-such-product}}"));
	const v = validate(w);
	assert.equal(v.status, 1, v.output);
	assert.match(v.stderr, /names an unknown product id/);
});

test("eval questions resolve version placeholders from the facts file", async () => {
	const { loadQuestions } = await import("../eval-retrieval.mjs");
	const qs = loadQuestions(join(BUNDLE, "eval", "questions.json"));
	const uar = qs.find((q) => q.question.startsWith("What is the latest version of the Universal Agent Runtime"));
	assert.match(uar.contains[0], /^v\d+\.\d+\.\d+$/);
	assert.equal(JSON.stringify(qs).includes("{{"), false);
});

test("mutation: an eval question naming an unknown product id throws", async () => {
	const { loadQuestions } = await import("../eval-retrieval.mjs");
	const path = join(tempDir("eval"), "q.json");
	writeFileSync(path, JSON.stringify([{ question: "q", expect_file: "f.md", expect_contains: ["{{v:no-such}}"] }]));
	assert.throws(() => loadQuestions(path, facts), /names an unknown product id/);
});
