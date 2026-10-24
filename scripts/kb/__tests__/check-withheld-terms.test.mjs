import assert from "node:assert/strict";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { buildTerms, nameForms, scan } from "../check-withheld-terms.mjs";
import { BUNDLE, CORPUS, REPO_ROOT, copyTree, runNode, tempDir } from "./helpers.mjs";

const SCRIPT = "scripts/kb/check-withheld-terms.mjs";
const FACTS = join(BUNDLE, "product-facts.json");
const SITE = join(REPO_ROOT, "content/site");

const row = (over = {}) => ({ id: "x", name: "X", publication: "public", ...over });

/** A temp root holding one file with the given text; returns the root. */
function rootWith(file, text) {
	const dir = tempDir("withheld");
	mkdirSync(join(dir, "sub"), { recursive: true });
	writeFileSync(join(dir, "sub", file), text);
	return dir;
}

test("name forms: full name, slash parts and the name without trailing lowercase words", () => {
	assert.deepEqual(nameForms("Acme Bay client systems"), ["Acme Bay client systems", "Acme Bay"]);
	assert.deepEqual(nameForms("ASSET InterTech modernization program"), [
		"ASSET InterTech modernization program",
		"ASSET InterTech",
	]);
	assert.deepEqual(nameForms("PatientGPT"), ["PatientGPT"]);
	assert.deepEqual(nameForms("A Thing / Other Part"), ["A Thing / Other Part", "Other Part", "A Thing"]);
});

test("terms come from withheldTerms and from every row that is not public", () => {
	const terms = buildTerms({
		withheldTerms: ["Headscale"],
		rows: [row({ id: "p", name: "Open Tool" }), row({ id: "c", name: "PatientGPT", publication: "pending-consent" })],
	}).map((t) => t.term);
	assert.deepEqual(terms, ["Headscale", "PatientGPT"]);
});

test("the committed facts file yields the expected withheld names", () => {
	const facts = JSON.parse(readFileSync(FACTS, "utf8"));
	const terms = buildTerms(facts).map((t) => t.term);
	const withheld = facts.rows.find((r) => r.id === "clients");
	assert.equal(withheld.publication, "withheld");
	for (const t of ["PatientGPT", "TribeHealth", "HotSeaters", "ASSET InterTech", "ASO Prior Authorization Workbench", ...nameForms(withheld.name)]) {
		assert.ok(terms.includes(t), t);
	}
	assert.equal(terms.includes("Native agent creator"), false);
});

test("matching is case-insensitive and on whole words", () => {
	const terms = buildTerms({ withheldTerms: ["Mac mini"], rows: [row({ name: "PatientGPT", publication: "pending-consent" })] });
	const hit = (text) => scan([{ dir: rootWith("a.md", text), exts: [".md"] }], terms).length;
	assert.equal(hit("Runs on a MAC MINI."), 1);
	assert.equal(hit("Runs on a Mac\nmini."), 0, "a term split across lines is not one line");
	assert.equal(hit("patientgpt's plan"), 1);
	assert.equal(hit("PatientGPTx is something else"), 0);
	assert.equal(hit("SuperPatientGPT"), 0);
	assert.equal(hit("Mac  mini with two spaces"), 1);
	assert.equal(hit("Patient**GPT** in emphasis"), 1);
	assert.equal(hit("Patient\u200BGPT with a zero-width space"), 1);
});

test("CLI exits 0 on the repository content as it stands", () => {
	const r = runNode(SCRIPT);
	assert.equal(r.status, 0, r.output);
	assert.match(r.stdout, /0 hit\(s\)/);
});

test("CLI mutation: a withheld term added to a copy of content/knowledge exits 1 and names file and line", () => {
	const copy = copyTree(CORPUS, "corpus");
	const file = join(copy, "the-boss.md");
	const lines = readFileSync(file, "utf8").split("\n");
	lines.splice(2, 0, "It runs on a Headscale network.");
	writeFileSync(file, lines.join("\n"));
	const r = runNode(SCRIPT, ["--root", copy]);
	assert.equal(r.status, 1, r.output);
	assert.match(r.stdout, /the-boss\.md:3: "Headscale" \(withheld term\)/);
});

test("CLI mutation: a pending-consent name added to a copy of content/site (.ts) exits 1", () => {
	const copy = copyTree(SITE, "site");
	const file = join(copy, "about.ts");
	writeFileSync(file, `${readFileSync(file, "utf8")}\n// tribehealth\n`);
	const r = runNode(SCRIPT, ["--root", copy]);
	assert.equal(r.status, 1, r.output);
	assert.match(r.stdout, /about\.ts:\d+: "TribeHealth" \(name of pending-consent row tribehealth\)/);
});

test("CLI mutation: the withheld client name, shortened, is caught in a .md file", () => {
	const facts = JSON.parse(readFileSync(FACTS, "utf8"));
	const short = nameForms(facts.rows.find((r) => r.id === "clients").name).at(-1);
	const r = runNode(SCRIPT, ["--root", rootWith("page.md", `Work for ${short}.\n`)]);
	assert.equal(r.status, 1, r.output);
	assert.match(r.stdout, /page\.md:1: ".+" \(name of withheld row clients\)/);
});

test("CLI: files other than .md and .ts are not scanned", () => {
	const r = runNode(SCRIPT, ["--root", rootWith("data.json", '{"x":"PatientGPT"}\n')]);
	assert.equal(r.status, 0, r.output);
});

test("CLI: removing a name's row from the facts makes the same text pass", () => {
	const facts = JSON.parse(readFileSync(FACTS, "utf8"));
	facts.rows = facts.rows.filter((r) => r.id !== "hotseaters");
	const factsFile = join(tempDir("facts"), "facts.json");
	writeFileSync(factsFile, JSON.stringify(facts));
	const root = rootWith("p.md", "HotSeaters\n");
	assert.equal(runNode(SCRIPT, ["--root", root]).status, 1);
	assert.equal(runNode(SCRIPT, ["--root", root, "--facts", factsFile]).status, 0);
});
