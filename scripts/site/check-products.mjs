// Drift check for the ten product pages (content/site/products.ts).
//
//   node scripts/site/check-products.mjs            exit 1 on any problem (CI runs this)
//   node scripts/site/check-products.mjs --online   also asks GitHub whether each linked repository
//                                                   is public and whether each link resolves
//                                                   (needs `gh`, `curl` and network; run before a release)
//
// What it guards (docs/design/product-directory.md section 4.1, change site-product-pages):
//   - a page names a slug that is not a directory tile, or a facts row that is not public, or
//     disagrees with the tile's rows and title (the directory is generated from the facts file);
//   - a page carries its own status, version or date: the module may hold only the words, and no
//     version number, date or release-tag URL, because the page reads all three from
//     content/site/directory.ts (the unit test renders every page against that file);
//   - a copy limit: name, lead, fact label and value, question count and length;
//   - a fact with no traceable source (a knowledge page that exists, or a facts row);
//   - a source link that is not https, or that points to a private repository;
//   - a pricing, compliance or certification claim, a banned word, a withheld term, or the name of
//     a row that is not public, in any page string.
//
// Inputs: docs/knowledge-source/product-facts.json, content/site/directory-copy.ts,
// content/site/directory.ts, content/site/products.ts, content/site/products-copy.ts.
// Options for tests: --facts <path> --pages <path> --directory <path> --copy <path> --products-copy <path>

import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { FORBIDDEN_CLAIMS, FORBIDDEN_WORDS } from "./build-directory.mjs";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const KNOWLEDGE = path.join(REPO_ROOT, "docs/knowledge-source");
const DEFAULTS = {
	facts: path.join(KNOWLEDGE, "product-facts.json"),
	pages: path.join(REPO_ROOT, "content/site/products.ts"),
	directory: path.join(REPO_ROOT, "content/site/directory.ts"),
	copy: path.join(REPO_ROOT, "content/site/directory-copy.ts"),
	productsCopy: path.join(REPO_ROOT, "content/site/products-copy.ts"),
};

export const MAX_NAME = 32;
export const MAX_LEAD_WORDS = 25;
export const MAX_LABEL_WORDS = 3;
export const MAX_VALUE_WORDS = 20;
export const MIN_FACTS = 3;
export const MAX_FACTS = 5;
export const MIN_QUESTIONS = 2;
export const MAX_QUESTIONS = 4;
export const MAX_QUESTION = 70;

/**
 * Repositories confirmed private with `gh api repos/<owner>/<repo> --jq .private`. A page may not
 * link to one. Add a repository here when the check run with --online finds it private.
 */
export const PRIVATE_REPOS = ["Know-Me-Tools/locus"];

const PAGE_KEYS = ["slug", "name", "rows", "lead", "facts", "questions", "sources"];
const FACT_KEYS = ["label", "value", "source"];
const SOURCE_KEYS = ["label", "url"];

// A version number ("v2.2.41", "1.3.0", "4.1"), an ISO date or a "24 Oct 2026" date. "CC-BY-4.0" and
// "AG-UI" are not versions: a number glued to a hyphen is skipped.
const VERSION = /(?<![\w.-])v?\d+\.\d+(\.\d+)?(?![\w-])/;
const ISO_DATE = /\b\d{4}-\d{2}-\d{2}\b/;
const WORD_DATE = /\b\d{1,2} (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* \d{4}\b/;
const PRONOUN = /\b(it|its|this|that|these|those|they|them|their)\b/i;
const SUPERLATIVE = /\b(best|fastest|only|most|easiest|leading|greatest|unique|better)\b/i;
const STATED = [VERSION, ISO_DATE, WORD_DATE];

const words = (text) => text.trim().split(/\s+/).filter(Boolean);

function stringsOf(value) {
	if (typeof value === "string") return [value];
	if (Array.isArray(value)) return value.flatMap(stringsOf);
	if (value && typeof value === "object") return Object.values(value).flatMap(stringsOf);
	return [];
}

/** Share of `a`'s words that also occur in `b` (case-insensitive), 0 to 1. */
function overlap(a, b) {
	const clean = (t) => words(t.toLowerCase().replace(/[^\w\s-]/g, ""));
	const bag = new Set(clean(b));
	const aw = clean(a);
	return aw.length === 0 ? 0 : aw.filter((w) => bag.has(w)).length / aw.length;
}

function githubRepo(url) {
	const m = /^https:\/\/github\.com\/([^/]+)\/([^/#?]+)/.exec(url);
	return m ? `${m[1]}/${m[2]}` : null;
}

/**
 * Returns every problem between the product pages and the facts file, the copy and the generated
 * directory. Empty means the pages fit. `knowledgeRoot` is where `docs/knowledge-source` is.
 *
 * @param {{ doc: any, copy: any, directory: any, pages: any[], productsCopy: any, knowledgeRoot?: string }} input
 */
export function validateProducts({ doc, copy, directory, pages, productsCopy, knowledgeRoot = KNOWLEDGE }) {
	const errors = [];
	const rows = doc.rows ?? [];
	const publicIds = new Set(rows.filter((r) => r.publication === "public").map((r) => r.id));
	const allIds = new Set(rows.map((r) => r.id));
	const publicRowOf = new Map(rows.filter((r) => r.publication === "public").map((r) => [r.id, r]));
	const leads = new Map(directory.families.flatMap((f) => f.leads.map((l) => [l.slug, l])));
	const copyLeads = new Map(copy.leads.map((l) => [l.slug, l]));

	const seen = new Set();
	for (const page of pages) {
		const where = `page "${page.slug}"`;
		for (const key of Object.keys(page)) {
			if (!PAGE_KEYS.includes(key))
				errors.push(`${where}: unknown field "${key}" (status, version and date are read from the directory, never written here)`);
		}
		if (seen.has(page.slug)) errors.push(`${where}: duplicate slug`);
		seen.add(page.slug);

		// Slug, rows and name against the directory.
		const lead = leads.get(page.slug);
		if (!lead) {
			errors.push(`${where}: no directory tile has this slug`);
			continue;
		}
		const tileRows = lead.entries.map((e) => e.id);
		for (const id of page.rows) {
			if (!allIds.has(id)) errors.push(`${where}: row "${id}" is not in the facts file`);
			else if (!publicIds.has(id)) errors.push(`${where}: row "${id}" is not a public facts row`);
		}
		if (JSON.stringify(page.rows) !== JSON.stringify(tileRows))
			errors.push(`${where}: rows [${page.rows}] differ from the directory tile's rows [${tileRows}]`);
		if (page.name !== lead.title) errors.push(`${where}: name "${page.name}" differs from the tile title "${lead.title}"`);
		if (page.name.length > MAX_NAME) errors.push(`${where}: name is over ${MAX_NAME} characters`);

		// Lead.
		const leadWords = words(page.lead).length;
		if (leadWords > MAX_LEAD_WORDS) errors.push(`${where}: lead is ${leadWords} words, the limit is ${MAX_LEAD_WORDS}`);
		if (/[.!?]\s+\S/.test(page.lead)) errors.push(`${where}: the lead must be one sentence`);
		if (!page.lead.endsWith(".")) errors.push(`${where}: the lead must end with a full stop`);
		const status = lead.entries.length === 1 ? lead.entries[0].status : null;
		if (
			(status === "design" || status === "prototype" || status === "assessment") &&
			!/propos|design|prototype|plan|assess|not |no /i.test(page.lead)
		)
			errors.push(`${where}: the tile is "${status}" but the lead does not say so (never the present tense of something available)`);
		if (STATED.some((p) => p.test(page.lead))) errors.push(`${where}: the lead carries a version number or a date`);

		// Facts.
		if (page.facts.length < MIN_FACTS || page.facts.length > MAX_FACTS)
			errors.push(`${where}: ${page.facts.length} facts, need ${MIN_FACTS} to ${MAX_FACTS}`);
		const labels = new Set();
		for (const fact of page.facts) {
			const at = `${where}, fact "${fact.label}"`;
			for (const key of Object.keys(fact)) if (!FACT_KEYS.includes(key)) errors.push(`${at}: unknown field "${key}"`);
			if (labels.has(fact.label)) errors.push(`${at}: duplicate label`);
			labels.add(fact.label);
			if (!fact.label?.trim() || words(fact.label).length > MAX_LABEL_WORDS)
				errors.push(`${at}: the label must be 1 to ${MAX_LABEL_WORDS} words`);
			const value = fact.value ?? "";
			const n = words(value).length;
			if (n === 0 || n > MAX_VALUE_WORDS) errors.push(`${at}: the value is ${n} words, the limit is ${MAX_VALUE_WORDS}`);
			if (page.lead.toLowerCase().includes(value.toLowerCase().replace(/\.$/, "")) || overlap(value, page.lead) >= 0.7)
				errors.push(`${at}: restates the lead`);
			if (STATED.some((p) => p.test(value)))
				errors.push(`${at}: carries a version number or a date; the page reads those from the directory`);
			if (typeof fact.source !== "string" || !fact.source) errors.push(`${at}: no source`);
			else if (fact.source.startsWith("facts:")) {
				const id = fact.source.slice("facts:".length);
				if (!page.rows.includes(id)) errors.push(`${at}: source "${fact.source}" is not one of the page's rows`);
			} else if (!existsSync(path.join(knowledgeRoot, fact.source))) {
				errors.push(`${at}: source "${fact.source}" is not a file under docs/knowledge-source`);
			}
		}

		// Questions.
		if (page.questions.length < MIN_QUESTIONS || page.questions.length > MAX_QUESTIONS)
			errors.push(`${where}: ${page.questions.length} questions, need ${MIN_QUESTIONS} to ${MAX_QUESTIONS}`);
		if (page.questions[0] !== lead.question)
			errors.push(`${where}: the first question must be the directory tile's question "${lead.question}"`);
		const names = [page.name, ...lead.entries.map((e) => e.name)];
		for (const q of page.questions) {
			// The tile's own question was approved with the directory; its wording is not re-judged here.
			const approved = q === lead.question;
			const at = `${where}, question "${q}"`;
			if (!q.endsWith("?")) errors.push(`${at}: must end with "?"`);
			if (q.length > MAX_QUESTION) errors.push(`${at}: over ${MAX_QUESTION} characters`);
			if (!names.some((name) => q.includes(name))) errors.push(`${at}: must name the product by its display name`);
			if (!approved && PRONOUN.test(q)) errors.push(`${at}: no pronouns ("it", "this", "its")`);
			if (SUPERLATIVE.test(q)) errors.push(`${at}: no superlatives`);
		}
		if (new Set(page.questions).size !== page.questions.length) errors.push(`${where}: duplicate question`);
		if (!copyLeads.has(page.slug)) errors.push(`${where}: the directory copy has no lead with this slug`);

		// Sources.
		const privateRows = page.rows.filter((id) => PRIVATE_REPOS.includes(publicRowOf.get(id)?.repo));
		if (page.sources.length === 0 && privateRows.length !== page.rows.length)
			errors.push(`${where}: no sources, but not every row's repository is private`);
		for (const source of page.sources) {
			const at = `${where}, source "${source.label}"`;
			for (const key of Object.keys(source)) if (!SOURCE_KEYS.includes(key)) errors.push(`${at}: unknown field "${key}"`);
			if (!source.label?.trim()) errors.push(`${at}: no label`);
			if (!/^https:\/\/[^\s]+$/.test(source.url ?? "")) errors.push(`${at}: the link must be an https URL`);
			const repo = githubRepo(source.url ?? "");
			if (repo && PRIVATE_REPOS.some((r) => r.toLowerCase() === repo.toLowerCase()))
				errors.push(`${at}: ${repo} is a private repository; leave it out`);
			if (/\/releases\/tag\//.test(source.url ?? ""))
				errors.push(`${at}: a release-tag URL carries a version; link the releases list`);
		}
	}

	for (const slug of copyLeads.keys()) {
		if (!seen.has(slug)) errors.push(`directory tile "${slug}" has no product page`);
	}

	// Words and claims, over every page string and every page-level string.
	const terms = (doc.withheldTerms ?? []).map((t) => String(t).toLowerCase()).filter(Boolean);
	const hidden = rows.filter((r) => r.publication !== "public");
	const visitorStrings = [
		...stringsOf(pages.map((p) => ({ ...p, sources: p.sources.map((s) => s.label) }))),
		...stringsOf(productsCopy),
	];
	for (const text of visitorStrings) {
		const lower = text.toLowerCase();
		if (FORBIDDEN_WORDS.test(text)) errors.push(`string "${text}" uses a banned word`);
		if (FORBIDDEN_CLAIMS.test(text)) errors.push(`string "${text}" makes a price, compliance or certification claim`);
		for (const term of terms) if (lower.includes(term)) errors.push(`string "${text}" contains the withheld term "${term}"`);
		for (const row of hidden) {
			if (lower.includes(row.name.toLowerCase())) errors.push(`string "${text}" names a row that is not public (${row.id})`);
		}
	}
	return errors;
}

/** Asks GitHub and the web whether each link is public. Needs `gh`, `curl` and network. */
export function onlineProblems(pages) {
	const problems = [];
	for (const page of pages) {
		for (const source of page.sources) {
			const repo = githubRepo(source.url);
			if (repo) {
				const r = spawnSync("gh", ["api", `repos/${repo}`, "--jq", ".private"], { encoding: "utf8" });
				if (r.status !== 0) problems.push(`page "${page.slug}": ${repo} did not resolve (${r.stderr.trim()})`);
				else if (r.stdout.trim() !== "false") problems.push(`page "${page.slug}": ${repo} is private`);
			}
			// crates.io answers a script with 404 for its page (the page is built by the browser), so ask its API.
			const crate = /^https:\/\/crates\.io\/crates\/([\w-]+)\/?$/.exec(source.url);
			const target = crate ? `https://crates.io/api/v1/crates/${crate[1]}` : source.url;
			const head = spawnSync(
				"curl",
				["-s", "-A", "knowme-link-check", "-o", "/dev/null", "-L", "-w", "%{http_code}", "--max-time", "20", target],
				{ encoding: "utf8" },
			);
			if (head.stdout.trim() !== "200") problems.push(`page "${page.slug}": ${source.url} answered ${head.stdout.trim() || "nothing"}`);
		}
	}
	return problems;
}

async function load(file, name) {
	const mod = await import(pathToFileURL(file).href);
	if (!mod[name]) throw new Error(`${file} does not export ${name}`);
	return mod[name];
}

function option(argv, name, fallback) {
	const i = argv.indexOf(name);
	return i >= 0 && argv[i + 1] ? path.resolve(argv[i + 1]) : fallback;
}

/** Runs the check. Returns the process exit code and writes messages to `io`. */
export async function main(argv, io = { out: (m) => console.log(m), err: (m) => console.error(m) }) {
	const factsFile = option(argv, "--facts", DEFAULTS.facts);
	if (!existsSync(factsFile)) {
		io.err(`check-products: facts file not found: ${factsFile}`);
		return 1;
	}
	const doc = JSON.parse(readFileSync(factsFile, "utf8"));
	const pages = await load(option(argv, "--pages", DEFAULTS.pages), "PRODUCT_PAGES");
	const directory = await load(option(argv, "--directory", DEFAULTS.directory), "DIRECTORY");
	const copy = await load(option(argv, "--copy", DEFAULTS.copy), "DIRECTORY_COPY");
	const productsCopy = await load(option(argv, "--products-copy", DEFAULTS.productsCopy), "PRODUCTS_COPY");

	const errors = validateProducts({ doc, copy, directory, pages, productsCopy });
	if (argv.includes("--online")) errors.push(...onlineProblems(pages));
	if (errors.length) {
		for (const e of errors) io.err(`check-products: ${e}`);
		return 1;
	}
	io.out(`OK ${pages.length} product pages fit the facts file and the directory`);
	return 0;
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
	process.exit(await main(process.argv.slice(2)));
}
