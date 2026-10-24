#!/usr/bin/env node
// Checks docs/knowledge-source/product-facts.json (product-facts-registry task 1.4).
//
//   node scripts/kb/check-product-facts.mjs [path] [--live]
//
// Schema checks always run. With --live, every row of kind "stable" is compared with the
// repository's GitHub "Latest" release, and every row of kind "registry" with the crates.io
// max stable version; a mismatch fails. Exits 1 on any failure and names the row.

import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

export const DEFAULT_PATH = "docs/knowledge-source/product-facts.json";
const KINDS = ["stable", "pre-release", "tag", "registry", "manifest", "untagged", "none", "unresolved"];
const PUBLICATION = ["public", "withheld", "pending-consent"];
const NEEDS_VALUE = ["stable", "pre-release", "tag", "registry", "manifest"];
const REPO = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Returns a list of schema problems; empty when the document is well formed. */
export function checkSchema(doc) {
	const errors = [];
	if (doc?.schema !== 1) errors.push("schema must be 1");
	if (!Array.isArray(doc?.rows) || doc.rows.length === 0) return [...errors, "rows must be a non-empty array"];
	if (!Array.isArray(doc.withheldTerms)) errors.push("withheldTerms must be an array");
	const seen = new Set();
	const terms = (Array.isArray(doc.withheldTerms) ? doc.withheldTerms : []).map((t) => String(t).toLowerCase());
	for (const row of doc.rows) {
		const where = `row ${row?.id ?? "(no id)"}`;
		const fail = (msg) => errors.push(`${where}: ${msg}`);
		if (!row?.id || typeof row.id !== "string") fail("id is required");
		else if (seen.has(row.id)) fail("duplicate id");
		else seen.add(row.id);
		for (const f of ["name", "family", "summary", "portfolioStatus"]) {
			if (typeof row?.[f] !== "string" || row[f].trim() === "") fail(`${f} is required`);
		}
		const text = JSON.stringify(row ?? {}).toLowerCase();
		for (const t of terms) if (t && text.includes(t)) fail(`contains the withheld term "${t}"`);
		if (row?.repo !== null && !REPO.test(row?.repo ?? "")) fail("repo must be owner/name or null");
		if (!DATE.test(row?.checked ?? "")) fail("checked must be YYYY-MM-DD");
		if (!PUBLICATION.includes(row?.publication)) fail(`publication must be one of ${PUBLICATION.join(", ")}`);
		else if (row.publication !== "public" && !row.publicationNote) fail("publicationNote is required when not public");
		const v = row?.version;
		if (!v || !KINDS.includes(v.kind)) {
			fail(`version.kind must be one of ${KINDS.join(", ")}`);
			continue;
		}
		if (NEEDS_VALUE.includes(v.kind) && (!v.value || !v.source)) fail(`version.value and version.source are required for kind ${v.kind}`);
		if (v.kind === "untagged" && !DATE.test(v.lastCommit ?? "")) fail("an untagged row needs version.lastCommit (YYYY-MM-DD)");
		if ((v.kind === "none" || v.kind === "unresolved") && !v.note) fail(`version.note is required for kind ${v.kind}`);
		if (row.repo === null && v.kind !== "none" && v.kind !== "manifest" && v.kind !== "registry") fail("a row without a repo can only have kind none, manifest or registry");
	}
	return errors;
}

async function defaultFetchJson(url) {
	const headers = { "User-Agent": "knowme-check-product-facts", Accept: "application/vnd.github+json" };
	if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
	const res = await fetch(url, { headers });
	if (!res.ok) throw new Error(`${url} answered HTTP ${res.status}`);
	return res.json();
}

/** Compares stable and registry rows with their live sources. fetchJson is injectable for tests. */
export async function checkLive(doc, fetchJson = defaultFetchJson) {
	const errors = [];
	for (const row of doc.rows) {
		const v = row.version;
		try {
			if (v.kind === "stable") {
				const latest = await fetchJson(`https://api.github.com/repos/${row.repo}/releases/latest`);
				if (latest.tag_name !== v.value) errors.push(`row ${row.id}: facts say ${v.value}, GitHub's latest release is ${latest.tag_name}`);
			} else if (v.kind === "registry") {
				const crate = await fetchJson("https://crates.io/api/v1/crates/prometheus_parking_lot");
				const live = `v${crate.crate.max_stable_version}`;
				if (live !== v.value) errors.push(`row ${row.id}: facts say ${v.value}, crates.io's max stable version is ${live}`);
			}
		} catch (err) {
			errors.push(`row ${row.id}: live check failed: ${err.message}`);
		}
	}
	return errors;
}

export async function main(argv, fetchJson) {
	const live = argv.includes("--live");
	const path = argv.find((a) => !a.startsWith("--")) ?? DEFAULT_PATH;
	const doc = JSON.parse(readFileSync(path, "utf8"));
	const errors = checkSchema(doc);
	if (errors.length === 0 && live) errors.push(...(await checkLive(doc, fetchJson)));
	for (const e of errors) console.error(`FAIL ${e}`);
	if (errors.length > 0) return 1;
	const kinds = {};
	for (const r of doc.rows) kinds[r.version.kind] = (kinds[r.version.kind] ?? 0) + 1;
	console.log(`OK ${doc.rows.length} rows${live ? " (live)" : ""} ${JSON.stringify(kinds)}`);
	return 0;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
	process.exit(await main(process.argv.slice(2)));
}
