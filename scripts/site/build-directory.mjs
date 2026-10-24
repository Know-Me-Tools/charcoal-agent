// Generates content/site/directory.ts, the data behind the home page product directory.
//
//   node scripts/site/build-directory.mjs           write content/site/directory.ts
//   node scripts/site/build-directory.mjs --check   exit 1 when the committed file differs from
//                                                   what the facts file and the copy would
//                                                   generate, or when the copy does not fit the
//                                                   facts file (a public row without copy, copy
//                                                   for an id that is not a public row)
//
// Inputs
//   docs/knowledge-source/product-facts.json   source of truth: which rows exist, which are public,
//                                              their version and portfolioStatus
//   content/site/directory-copy.ts             hand-written: display names, summaries, families,
//                                              lead questions, labels (the reviewable copy)
//
// Derived here, never written by hand: the status label (rule S1 to S7), the version lines, the
// entry order. The rules are docs/design/product-directory.md sections 2 and 3 and the appendix
// docs/design/product-directory-status-map.md; src/test/build-directory.test.ts compares the
// output with that appendix, row for row.
//
// Only rows whose `publication` is "public" are read into the output. Other rows contribute
// nothing except their names, which the copy must not mention.
//
// Options for tests: --facts <path> --copy <path> --out <path>

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
export const DEFAULT_FACTS = path.join(REPO_ROOT, "docs/knowledge-source/product-facts.json");
export const DEFAULT_COPY = path.join(REPO_ROOT, "content/site/directory-copy.ts");
export const DEFAULT_OUT = path.join(REPO_ROOT, "content/site/directory.ts");

export const MAX_SUMMARY = 90;
export const MAX_QUESTION = 70;

/** Label order in a family: what can be used comes first. */
export const STATUS_RANK = {
	released: 1,
	prerelease: 2,
	development: 3,
	prototype: 4,
	design: 5,
	assessment: 6,
};

// ---------------------------------------------------------------- status rule (first match wins)

/** Returns the status key for a facts row. Steps S1 to S7 of the appendix. */
export function statusOf(row) {
	const kind = row.version.kind;
	const text = row.portfolioStatus;
	if (kind === "stable" || kind === "registry") return "released"; // S1
	if (kind === "manifest") return "prerelease"; // S2
	if (/under assessment|status unresolved|needs? confirmation|uncertain/i.test(text)) return "assessment"; // S3
	if (/^existing/i.test(text)) return "development"; // S4
	if (/prototype|synthetic|\bMVP\b|starter/i.test(text)) return "prototype"; // S5
	if (
		/^(design|specification|architecture|published|service and economics design|research published|pre-implementation)/i.test(
			text,
		)
	) {
		return "design"; // S6
	}
	return "development"; // S7
}

// ---------------------------------------------------------------- version lines

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function formatDate(iso) {
	const [y, m, d] = iso.split("-").map(Number);
	return `${d} ${MONTHS[m - 1]} ${y}`;
}

/** One or two resolved lines. Never a version the facts file does not hold (decision D-003). */
export function versionLines(row) {
	const v = row.version;
	switch (v.kind) {
		case "stable": {
			const lines = [`${v.value} · ${formatDate(v.date)}`];
			if (v.preRelease) lines.push(`${v.preRelease.value} pre-release · ${formatDate(v.preRelease.date)}`);
			return lines;
		}
		case "registry":
			return [`${v.value} on crates.io · ${formatDate(v.date)}`];
		case "tag":
			return /^v\d/.test(v.value) ? [`Tag ${v.value} · no release`] : [`Build tag, no version · ${formatDate(v.date)}`];
		case "manifest":
			return [`${v.value} pre-release`];
		case "untagged":
			return [`No tagged release · last commit ${formatDate(v.lastCommit)}`];
		default:
			return ["No release recorded"];
	}
}

// ---------------------------------------------------------------- copy checks

/** Words and claims the site never makes (voice rules, PRODUCT.md constraints). */
const FORBIDDEN_WORDS = /seamless|cutting[- ]edge|leverag|utiliz|synerg|revolution|unleash|supercharge/i;
const FORBIDDEN_CLAIMS = /pricing|\bprices?\b|[$€£]\s?\d|gdpr|hipaa|soc ?2|certified|certification|compliant|guarantee/i;

function stringsOf(value) {
	if (typeof value === "string") return [value];
	if (Array.isArray(value)) return value.flatMap(stringsOf);
	if (value && typeof value === "object") return Object.values(value).flatMap(stringsOf);
	return [];
}

/**
 * Returns every problem between the facts file and the copy. Empty means the copy fits.
 * `doc` is the parsed facts file, `copy` the DIRECTORY_COPY object.
 */
export function validate(doc, copy) {
	const errors = [];
	const rows = doc.rows ?? [];
	const publicRows = rows.filter((r) => r.publication === "public");
	const publicIds = new Set(publicRows.map((r) => r.id));
	const allIds = new Set(rows.map((r) => r.id));
	const familySlugs = new Set(copy.families.map((f) => f.slug));

	for (const row of publicRows) {
		if (!copy.entries[row.id]) errors.push(`public row "${row.id}" has no entry in the directory copy`);
	}
	for (const id of Object.keys(copy.entries)) {
		if (!allIds.has(id)) errors.push(`copy entry "${id}" names an id that is not in the facts file`);
		else if (!publicIds.has(id)) errors.push(`copy entry "${id}" is for a row that is not public`);
	}

	for (const [id, entry] of Object.entries(copy.entries)) {
		if (!entry.name?.trim()) errors.push(`entry "${id}": name is required`);
		if (!familySlugs.has(entry.family)) errors.push(`entry "${id}": unknown family "${entry.family}"`);
		if (!entry.summary?.trim()) errors.push(`entry "${id}": summary is required`);
		else if (entry.summary.length > MAX_SUMMARY)
			errors.push(`entry "${id}": summary is ${entry.summary.length} characters, the limit is ${MAX_SUMMARY}`);
		const prompt = copy.rowPromptTemplate.replace("{name}", entry.name ?? "");
		if (prompt.length > MAX_QUESTION) errors.push(`entry "${id}": its ask prompt is over ${MAX_QUESTION} characters`);
	}

	const slugs = new Set();
	const claimed = new Map();
	for (const lead of copy.leads) {
		const where = `lead "${lead.slug}"`;
		if (slugs.has(lead.slug)) errors.push(`${where}: duplicate slug`);
		slugs.add(lead.slug);
		if (!familySlugs.has(lead.family)) errors.push(`${where}: unknown family "${lead.family}"`);
		if (!lead.question?.endsWith("?")) errors.push(`${where}: the question must end with "?"`);
		if ((lead.question ?? "").length > MAX_QUESTION)
			errors.push(`${where}: the question is over ${MAX_QUESTION} characters`);
		if (lead.rows.length > 1 && !lead.summary?.trim()) errors.push(`${where}: a tile with several rows needs a summary`);
		if (lead.summary && lead.summary.length > MAX_SUMMARY)
			errors.push(`${where}: summary is over ${MAX_SUMMARY} characters`);
		for (const id of lead.rows) {
			if (!publicIds.has(id)) errors.push(`${where}: row "${id}" is not a public facts row`);
			else if (copy.entries[id] && copy.entries[id].family !== lead.family)
				errors.push(`${where}: row "${id}" is in family "${copy.entries[id].family}", not "${lead.family}"`);
			if (claimed.has(id)) errors.push(`${where}: row "${id}" is already in lead "${claimed.get(id)}"`);
			claimed.set(id, lead.slug);
		}
	}

	// Words and claims. Every visitor-facing string in the copy.
	const terms = (doc.withheldTerms ?? []).map((t) => String(t).toLowerCase()).filter(Boolean);
	const hidden = rows.filter((r) => r.publication !== "public");
	for (const text of stringsOf(copy)) {
		const lower = text.toLowerCase();
		if (FORBIDDEN_WORDS.test(text)) errors.push(`copy string "${text}" uses a banned word`);
		if (FORBIDDEN_CLAIMS.test(text)) errors.push(`copy string "${text}" makes a price, compliance or certification claim`);
		for (const term of terms) if (lower.includes(term)) errors.push(`copy string "${text}" contains the withheld term "${term}"`);
		for (const row of hidden) {
			if (lower.includes(row.name.toLowerCase())) errors.push(`copy string "${text}" names a row that is not public (${row.id})`);
		}
	}
	return errors;
}

// ---------------------------------------------------------------- generation

function compareEntries(a, b) {
	return STATUS_RANK[a.status] - STATUS_RANK[b.status] || a.name.localeCompare(b.name, "en");
}

/** Builds the directory object from the facts document and the copy. Assumes `validate` passed. */
export function buildDirectory(doc, copy) {
	const byId = new Map(doc.rows.filter((r) => r.publication === "public").map((r) => [r.id, r]));
	const leadOf = new Map(copy.leads.flatMap((l) => l.rows.map((id) => [id, l.slug])));
	const entryFor = (id) => {
		const row = byId.get(id);
		const text = copy.entries[id];
		return {
			id,
			name: text.name,
			summary: text.summary,
			status: statusOf(row),
			versionLines: versionLines(row),
			productSlug: leadOf.get(id) ?? null,
			prompt: copy.rowPromptTemplate.replace("{name}", text.name),
		};
	};

	const families = copy.families.map((family) => {
		const leads = copy.leads
			.filter((l) => l.family === family.slug)
			.map((l) => {
				const entries = l.rows.map(entryFor);
				return {
					slug: l.slug,
					title: l.title,
					question: l.question,
					summary: l.summary ?? entries[0].summary,
					entries,
				};
			});
		const rest = [...byId.keys()]
			.filter((id) => copy.entries[id].family === family.slug && !leadOf.has(id))
			.map(entryFor)
			.sort(compareEntries);
		return { slug: family.slug, name: family.name, line: family.line, leads, rest };
	});

	return { checked: doc.checked, total: byId.size, families };
}

const HEADER = `/**
 * GENERATED by scripts/site/build-directory.mjs from docs/knowledge-source/product-facts.json
 * and content/site/directory-copy.ts. Do not edit by hand: change the facts file or the copy,
 * then run \`node scripts/site/build-directory.mjs\`. CI runs it with \`--check\` and fails when
 * this file is out of date.
 *
 * Status, version lines and order are derived from the facts file (docs/design/product-directory.md
 * sections 2 and 3). Names, summaries and questions come from the copy and are operator-approved
 * through docs/content/reviews/site-home-directory.md.
 *
 * Only public rows appear here.
 */
import type { DirectoryStatus } from "./directory-copy";

export interface DirectoryEntry {
	id: string;
	name: string;
	summary: string;
	status: DirectoryStatus;
	/** Resolved version line(s), shown as is. */
	versionLines: string[];
	/** The product page this entry belongs to (the page ships in a later change), or null. */
	productSlug: string | null;
	/** The ask chip's question for an index row. */
	prompt: string;
}

export interface DirectoryLead {
	/** The product page slug. Kept in the data; the tile does not link to it yet. */
	slug: string;
	title: string;
	/** The tile's ask chip question. */
	question: string;
	summary: string;
	entries: DirectoryEntry[];
}

export interface DirectoryFamily {
	slug: string;
	name: string;
	line: string;
	leads: DirectoryLead[];
	rest: DirectoryEntry[];
}

export interface Directory {
	/** The facts file's \`checked\` date. */
	checked: string;
	total: number;
	families: DirectoryFamily[];
}

`;

/** The full text of content/site/directory.ts. */
export function render(directory) {
	return `${HEADER}export const DIRECTORY: Directory = ${JSON.stringify(directory, null, "\t")};\n`;
}

// ---------------------------------------------------------------- CLI

async function loadCopy(file) {
	const mod = await import(pathToFileURL(file).href);
	if (!mod.DIRECTORY_COPY) throw new Error(`${file} does not export DIRECTORY_COPY`);
	return mod.DIRECTORY_COPY;
}

function option(argv, name, fallback) {
	const i = argv.indexOf(name);
	return i >= 0 && argv[i + 1] ? path.resolve(argv[i + 1]) : fallback;
}

/** Runs the script. Returns the process exit code and writes messages to `io`. */
export async function main(argv, io = { out: (m) => console.log(m), err: (m) => console.error(m) }) {
	const check = argv.includes("--check");
	const factsFile = option(argv, "--facts", DEFAULT_FACTS);
	const copyFile = option(argv, "--copy", DEFAULT_COPY);
	const outFile = option(argv, "--out", DEFAULT_OUT);

	if (!existsSync(factsFile)) {
		io.err(`build-directory: facts file not found: ${factsFile}`);
		return 1;
	}
	const doc = JSON.parse(readFileSync(factsFile, "utf8"));
	const copy = await loadCopy(copyFile);

	const errors = validate(doc, copy);
	if (errors.length) {
		for (const e of errors) io.err(`build-directory: ${e}`);
		return 1;
	}

	const directory = buildDirectory(doc, copy);
	const next = render(directory);
	if (check) {
		const current = existsSync(outFile) ? readFileSync(outFile, "utf8") : null;
		if (current !== next) {
			io.err(
				`build-directory: ${path.relative(REPO_ROOT, outFile)} is out of date with the facts file and the copy. Run: node scripts/site/build-directory.mjs`,
			);
			return 1;
		}
		io.out(`OK directory is current (${directory.total} public rows)`);
		return 0;
	}
	writeFileSync(outFile, next);
	io.out(`wrote ${path.relative(REPO_ROOT, outFile)} (${directory.total} public rows)`);
	return 0;
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
	process.exit(await main(process.argv.slice(2)));
}
