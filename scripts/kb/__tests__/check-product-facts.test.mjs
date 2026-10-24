import assert from "node:assert/strict";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { checkLive, checkSchema, main } from "../check-product-facts.mjs";
import { BUNDLE, runNode, tempDir } from "./helpers.mjs";

const FACTS = join(BUNDLE, "product-facts.json");
const load = () => JSON.parse(readFileSync(FACTS, "utf8"));

const row = (over = {}) => ({
	id: "x", name: "X", family: "Tools", summary: "s", portfolioStatus: "p", repo: "o/x", checked: "2026-10-24",
	publication: "public", version: { kind: "stable", value: "v1.0.0", source: "https://example.com" }, ...over,
});
const doc = (rows) => ({ schema: 1, withheldTerms: [], rows });

test("the committed facts file passes the schema check", () => {
	assert.deepEqual(checkSchema(load()), []);
});

test("the CLI exits 0 on the committed file and prints the row count", () => {
	const r = runNode("scripts/kb/check-product-facts.mjs");
	assert.equal(r.status, 0, r.output);
	assert.match(r.stdout, /^OK 58 rows/);
});

test("an untagged row without a last-commit date fails", () => {
	const errs = checkSchema(doc([row({ version: { kind: "untagged" } })]));
	assert.ok(errs.some((e) => e.startsWith("row x:") && e.includes("lastCommit")), errs.join("\n"));
});

test("a stable row without a source fails", () => {
	const errs = checkSchema(doc([row({ version: { kind: "stable", value: "v1.0.0" } })]));
	assert.ok(errs.some((e) => e.includes("version.source")), errs.join("\n"));
});

test("a row that is not public needs a note", () => {
	const errs = checkSchema(doc([row({ publication: "withheld" })]));
	assert.ok(errs.some((e) => e.includes("publicationNote")), errs.join("\n"));
});

test("a row whose text contains a withheld term fails and names the row and the term", () => {
	const d = doc([row({ id: "pgpt", portfolioStatus: "Runs on a Mac mini behind Headscale." })]);
	d.withheldTerms = ["Headscale"];
	const errs = checkSchema(d);
	assert.ok(errs.some((e) => e.startsWith("row pgpt:") && e.includes('"headscale"')), errs.join("\n"));
});

test("the committed file contains none of its own withheld terms", () => {
	const d = load();
	const text = JSON.stringify(d.rows).toLowerCase();
	for (const t of d.withheldTerms) assert.equal(text.includes(t.toLowerCase()), false, t);
});

test("duplicate ids fail", () => {
	const errs = checkSchema(doc([row(), row()]));
	assert.ok(errs.some((e) => e.includes("duplicate id")));
});

test("CLI mutation: removing a last-commit date from the real file makes it exit 1 and name the row", () => {
	const mutated = load();
	const victim = mutated.rows.find((r) => r.version.kind === "untagged");
	delete victim.version.lastCommit;
	const path = join(tempDir("facts"), "product-facts.json");
	writeFileSync(path, JSON.stringify(mutated));
	const r = runNode("scripts/kb/check-product-facts.mjs", [path]);
	assert.equal(r.status, 1);
	assert.ok(r.stderr.includes(`row ${victim.id}:`), r.stderr);
});

test("live: a matching latest release passes", async () => {
	const errs = await checkLive(doc([row()]), async () => ({ tag_name: "v1.0.0" }));
	assert.deepEqual(errs, []);
});

test("live mutation: a stable row naming a version that is not the latest fails and names the row", async () => {
	const errs = await checkLive(doc([row({ id: "uar", version: { kind: "stable", value: "v1.0.0", source: "https://example.com" } })]), async () => ({ tag_name: "v1.2.3" }));
	assert.equal(errs.length, 1);
	assert.match(errs[0], /row uar: facts say v1\.0\.0, GitHub's latest release is v1\.2\.3/);
});

test("live: a registry row is compared with the crates.io max stable version", async () => {
	const r = row({ id: "parking", version: { kind: "registry", value: "v0.2.0", source: "https://crates.io" } });
	const errs = await checkLive(doc([r]), async () => ({ crate: { max_stable_version: "0.3.0" } }));
	assert.match(errs[0], /row parking: facts say v0\.2\.0, crates\.io's max stable version is v0\.3\.0/);
});

test("live: a failed lookup is reported, not skipped", async () => {
	const errs = await checkLive(doc([row()]), async () => {
		throw new Error("HTTP 500");
	});
	assert.match(errs[0], /live check failed: HTTP 500/);
});

test("main returns 1 when the live check finds a mismatch", async () => {
	const path = join(tempDir("facts"), "f.json");
	writeFileSync(path, JSON.stringify(doc([row()])));
	assert.equal(await main([path, "--live"], async () => ({ tag_name: "v9.9.9" })), 1);
});
