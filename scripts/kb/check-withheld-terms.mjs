#!/usr/bin/env node
// PRIV-1 check (kb-tools-and-partner-pages task 1.4).
//
//   node scripts/kb/check-withheld-terms.mjs [--facts <file>] [--root <dir>]...
//
// Scans every .md under content/knowledge and content/site, and every .ts under
// content/site, for:
//   (a) a term in `withheldTerms` of docs/knowledge-source/product-facts.json, and
//   (b) the name of a row whose `publication` is not "public".
// A row name yields up to three match forms: the full name, each part of a name
// written "A / B", and the name with its trailing lowercase words removed
// ("Acme Bay client systems" also matches "Acme Bay"). Matching is
// case-insensitive and on whole words, after markdown emphasis marks (* _ ~ `)
// and zero-width characters are removed from the line. Exits 1 and prints file:line for each hit.
//
// --root replaces the default directories; each root is scanned for both .md and .ts.

import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { dirname, extname, join, relative, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
export const DEFAULT_FACTS = join(REPO_ROOT, "docs/knowledge-source/product-facts.json");
export const DEFAULT_ROOTS = [
	{ dir: join(REPO_ROOT, "content/knowledge"), exts: [".md"] },
	{ dir: join(REPO_ROOT, "content/site"), exts: [".md", ".ts"] },
];

const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Match forms for one row name, longest first. */
export function nameForms(name) {
	const forms = new Set();
	const add = (s) => {
		const t = s.trim().replace(/\s+/g, " ");
		if (t.length >= 3) forms.add(t);
	};
	add(name);
	const parts = name.split(/\s+\/\s+/);
	for (const part of parts) {
		add(part);
		const words = part.trim().split(/\s+/);
		while (words.length > 1 && /^[a-z]/.test(words[words.length - 1])) words.pop();
		add(words.join(" "));
	}
	return [...forms].sort((a, b) => b.length - a.length);
}

/** Every term to reject, each with the reason it is rejected. */
export function buildTerms(facts) {
	const terms = [];
	for (const t of facts.withheldTerms ?? []) {
		if (String(t).trim()) terms.push({ term: String(t).trim(), reason: "withheld term" });
	}
	for (const row of facts.rows ?? []) {
		if (row?.publication === "public" || typeof row?.name !== "string") continue;
		for (const form of nameForms(row.name)) {
			terms.push({ term: form, reason: `name of ${row.publication} row ${row.id}` });
		}
	}
	return terms.map((t) => ({
		...t,
		// Whole words: no letter or digit directly before or after the term.
		re: new RegExp(`(?<![\\p{L}\\p{N}])${escape(t.term).replace(/ /g, "\\s+")}(?![\\p{L}\\p{N}])`, "iu"),
	}));
}

function listFiles(dir, exts) {
	if (!existsSync(dir)) return [];
	const out = [];
	for (const name of readdirSync(dir).sort()) {
		const p = join(dir, name);
		const st = statSync(p);
		if (st.isDirectory()) out.push(...listFiles(p, exts));
		else if (exts.includes(extname(name))) out.push(p);
	}
	return out;
}

/** Returns hits as { file, line, term, reason }. */
export function scan(roots, terms) {
	const hits = [];
	for (const { dir, exts } of roots) {
		for (const file of listFiles(dir, exts)) {
			const lines = readFileSync(file, "utf8").split("\n");
			lines.forEach((raw, i) => {
				const text = raw.replace(/[*_~`\u200B-\u200D\u2060\uFEFF]/g, "");
				for (const t of terms) {
					if (t.re.test(text)) hits.push({ file, line: i + 1, term: t.term, reason: t.reason });
				}
			});
		}
	}
	return hits;
}

export function main(argv = process.argv.slice(2)) {
	let factsPath = DEFAULT_FACTS;
	const roots = [];
	for (let i = 0; i < argv.length; i++) {
		const a = argv[i];
		if (a === "--facts" || a === "--root") {
			if (i + 1 >= argv.length) {
				console.error(`${a} needs a value`);
				return 2;
			}
			const v = resolve(argv[++i]);
			if (a === "--facts") factsPath = v;
			else roots.push({ dir: v, exts: [".md", ".ts"] });
		} else {
			console.error(`unknown argument: ${a}`);
			return 2;
		}
	}
	const facts = JSON.parse(readFileSync(factsPath, "utf8"));
	const terms = buildTerms(facts);
	const hits = scan(roots.length ? roots : DEFAULT_ROOTS, terms);
	for (const h of hits) {
		console.log(`${relative(process.cwd(), h.file)}:${h.line}: "${h.term}" (${h.reason})`);
	}
	console.log(`check-withheld-terms: ${hits.length} hit(s), ${terms.length} term(s) checked`);
	return hits.length ? 1 : 0;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) process.exit(main());
