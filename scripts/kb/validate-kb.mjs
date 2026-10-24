#!/usr/bin/env node
// Validates the knowledge source bundle and the flat KB corpus
// (site-kb-content-pipeline task 2.3). Exits 1 on any failure and prints
// file:line for each one; warnings do not fail.
//
// Checks:
//   (a) OKF 0.2 section 11 over docs/knowledge-source: every non-reserved .md
//       has parseable frontmatter (strict subset, see lib/frontmatter.mjs) and a
//       non-empty `type`; index.md has no frontmatter except `okf_version` at
//       the bundle root, and its link bullets read `* [Title](url) - description`;
//       log.md has no frontmatter and `## YYYY-MM-DD` headings, newest first.
//   (b) Project rule: title, description, status, generated {by, at} required;
//       every sources entry has an id, a public URL resource and a retrieval
//       date; a concept marks external claims with footnote references [^id]
//       (per claim) or `external_claims: true` (whole concept), and each
//       reference must name a sources entry.
//   (c) Broken bundle links: reported as warnings only.
//   (d) Secret, credential and personal-data PATTERNS over every file in both
//       trees: key and token prefixes, private-key headers, long high-entropy
//       strings, password-style assignments, email addresses outside
//       scripts/kb/email-allowlist.txt, SSN-like and phone-like numbers, and
//       absolute home-directory paths.
//   (e) Banned assertions in .md files: certification or compliance claims,
//       HIPAA, FDA, SOC 2, ISO 27001, "provably", and currency amounts. A
//       match is an assertion unless a negation (not, never, no, without, n't
//       ...) precedes it in the same sentence. The sentences "pricing has not
//       been announced" and "browser-certified on synthetic data only" are
//       always allowed.
//   (f) content/knowledge/ipfs-sync-for-obsidian.md and content/knowledge/the-boss.md
//       must exist (the seed's FR-8 checks depend on them).
//
// Usage: node scripts/kb/validate-kb.mjs [--bundle <dir>] [--corpus <dir>] [--email-allowlist <file>]

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { hasPlaceholders, loadFacts, resolvePlaceholders } from "./lib/product-facts.mjs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import {
  ISO_DATETIME,
  ROOT_INDEX_KEYS,
  footnoteRefs,
  parseConceptFile,
  retrievalDate,
  splitFrontmatter,
} from "./lib/frontmatter.mjs";

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
export const FR8_FILES = ["ipfs-sync-for-obsidian.md", "the-boss.md"];
const STATUSES = new Set(["draft", "stable", "deprecated"]);
const ACTOR = /^(?:human|process):\S+$|^[^/\s:]+\/\S+$/;
const TEXT_EXTENSIONS = new Set([".md", ".json", ".txt", ".yml", ".yaml"]);

export const ALLOWED_SENTENCES = ["pricing has not been announced", "browser-certified on synthetic data only"];

const NEGATION = /\b(?:not|never|no|none|nor|without|cannot)\b|n't\b/i;

export const BANNED_ASSERTIONS = [
  { name: "certification claim", re: /\bcertifi(?:ed|cation|cations|es|y)\b/i },
  { name: "compliance claim", re: /\bcomplian(?:t|ce)\b/i },
  { name: "HIPAA claim", re: /\bHIPAA\b/i },
  { name: "FDA claim", re: /\bFDA\b/ },
  { name: "SOC 2 claim", re: /\bSOC ?2\b/i },
  { name: "ISO 27001 claim", re: /\bISO[ /]?27001\b/i },
  { name: "'provably' claim", re: /\bprovabl[ey]\b/i },
  { name: "price amount", re: /[$€£¥]\s?\d/ },
  { name: "price amount", re: /\b\d+(?:[.,]\d+)?\s?(?:USD|EUR|GBP|dollars?|euros?)\b/i },
  { name: "price statement", re: /\bpriced at\b/i },
];

// Built from fragments so this file does not itself contain the strings it bans.
const HOME_PATH = new RegExp("(?:\\/(?:Use" + "rs|home)\\/[A-Za-z0-9._-]+)|(?:[A-Za-z]:\\\\Use" + "rs\\\\)");
const PRIVATE_KEY = new RegExp("-----BEGIN [A-Z ]*PRIVATE " + "KEY-----");

export const SECRET_PATTERNS = [
  { name: "API key prefix (sk-)", re: /\bsk-[A-Za-z0-9_-]{20,}/ },
  { name: "payment key prefix", re: /\b(?:sk|pk|rk)_(?:live|test)_[A-Za-z0-9]{16,}/ },
  { name: "GitHub token prefix", re: /\b(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{30,})/ },
  { name: "Slack token prefix", re: /\bxox[abprs]-[A-Za-z0-9-]{10,}/ },
  { name: "cloud access key id", re: /\bAKIA[0-9A-Z]{16}\b/ },
  { name: "Google API key prefix", re: /\bAIza[0-9A-Za-z_-]{35}/ },
  { name: "GitLab token prefix", re: /\bglpat-[A-Za-z0-9_-]{20,}/ },
  { name: "Hugging Face token prefix", re: /\bhf_[A-Za-z0-9]{30,}/ },
  { name: "JSON web token", re: /\beyJ[A-Za-z0-9_-]{8,}\.eyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}/ },
  { name: "private key header", re: PRIVATE_KEY },
  {
    name: "credential assignment",
    re: /\b(?:password|passwd|pwd|secret|api[_-]?key|access[_-]?token|auth[_-]?token|client[_-]?secret)\b["']?\s*[:=]\s*["']?[^\s"'`,;)]{6,}/i,
  },
  { name: "SSN-like number", re: /(?<![\w-])\d{3}-\d{2}-\d{4}(?![\w-])/ },
  { name: "phone-like number", re: /(?<![\w.+-])(?:\+?1[ .-]?)?\(?\d{3}\)?[ .-]\d{3}[ .-]\d{4}(?![\w.-])/ },
  { name: "absolute home-directory path", re: HOME_PATH },
];

const EMAIL = /[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}/g;
const HIGH_ENTROPY_TOKEN = /[A-Za-z0-9+_=-]{32,}/g;
const ENTROPY_THRESHOLD = 4.3;

export function parseArgs(argv) {
  const opts = {
    bundle: join(REPO_ROOT, "docs/knowledge-source"),
    corpus: join(REPO_ROOT, "content/knowledge"),
    emailAllowlist: join(REPO_ROOT, "scripts/kb/email-allowlist.txt"),
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const next = () => {
      if (i + 1 >= argv.length) throw new Error(`${a} needs a value`);
      return argv[++i];
    };
    if (a === "--bundle") opts.bundle = resolve(next());
    else if (a === "--corpus") opts.corpus = resolve(next());
    else if (a === "--email-allowlist") opts.emailAllowlist = resolve(next());
    else throw new Error(`unknown argument: ${a}`);
  }
  return opts;
}

function walk(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .sort()
    .flatMap((name) => {
      const p = join(dir, name);
      return statSync(p).isDirectory() ? walk(p) : [p];
    });
}

function shannon(s) {
  const counts = new Map();
  for (const c of s) counts.set(c, (counts.get(c) ?? 0) + 1);
  let h = 0;
  for (const n of counts.values()) {
    const p = n / s.length;
    h -= p * Math.log2(p);
  }
  return h;
}

class Report {
  failures = [];
  warnings = [];
  fail(file, line, message) {
    this.failures.push(`${relative(process.cwd(), file)}:${line}: ${message}`);
  }
  warn(file, line, message) {
    this.warnings.push(`${relative(process.cwd(), file)}:${line}: ${message}`);
  }
}

// ── (a) and (b): OKF conformance and the project rule ───────────────────────

function checkIndex(file, text, isRoot, report) {
  const split = splitFrontmatter(text);
  if (split.error) report.fail(file, split.error.line, split.error.message);
  if (split.present && !split.error) {
    if (!isRoot) report.fail(file, 1, "index.md below the bundle root takes no frontmatter");
    else {
      const parsed = parseConceptFile(text, ROOT_INDEX_KEYS);
      for (const e of parsed.errors) report.fail(file, e.line, `root index frontmatter: ${e.message}`);
      if (parsed.data.okf_version !== undefined && parsed.data.okf_version !== "0.2") {
        report.fail(file, 2, `okf_version must be "0.2"`);
      }
    }
  }
  const offset = split.present && !split.error ? split.bodyStartLine - 1 : 0;
  (split.present && !split.error ? split.body : text).split("\n").forEach((line, i) => {
    if (/^[*-] \[/.test(line) && !/^\* \[[^\]]+\]\([^)\s]+\)(?: - \S.*)?$/.test(line)) {
      report.fail(file, offset + i + 1, "index entry must read '* [Title](url) - description'");
    } else if (/^[*-] /.test(line) && !/^[*-] \[/.test(line)) {
      report.warn(file, offset + i + 1, "index bullet without a link");
    }
  });
}

function checkLog(file, text, report) {
  if (splitFrontmatter(text).present) report.fail(file, 1, "log.md takes no frontmatter");
  let previous = null;
  text.split("\n").forEach((line, i) => {
    if (!line.startsWith("## ")) return;
    const m = /^## (\d{4}-\d{2}-\d{2})$/.exec(line);
    if (!m) {
      report.fail(file, i + 1, "log headings must be '## YYYY-MM-DD'");
      return;
    }
    if (previous !== null && m[1] >= previous) report.fail(file, i + 1, "log dates must be newest first and unique");
    previous = m[1];
  });
}

function nonEmptyString(v) {
  return typeof v === "string" && v.trim() !== "";
}

function checkConcept(file, text, report) {
  const parsed = parseConceptFile(text);
  if (!parsed.present) {
    report.fail(file, 1, "missing frontmatter (OKF requires at least `type`)");
    return;
  }
  for (const e of parsed.errors) report.fail(file, e.line, `frontmatter: ${e.message}`);
  const fm = parsed.data;
  if (!nonEmptyString(fm.type)) report.fail(file, 1, "frontmatter `type` is required and must be non-empty (OKF 0.2 section 11)");
  for (const key of ["title", "description"]) {
    if (!nonEmptyString(fm[key])) report.fail(file, 1, `frontmatter \`${key}\` is required (project rule)`);
  }
  if (!STATUSES.has(fm.status)) report.fail(file, 1, "frontmatter `status` must be draft, stable or deprecated (project rule)");
  if (!fm.generated || typeof fm.generated !== "object") {
    report.fail(file, 1, "frontmatter `generated` {by, at} is required (project rule)");
  } else {
    if (!ACTOR.test(String(fm.generated.by ?? ""))) report.fail(file, 1, "`generated.by` must be <producer>/<version>, human:<id> or process:<id>");
    if (!ISO_DATETIME.test(String(fm.generated.at ?? ""))) report.fail(file, 1, "`generated.at` must be ISO 8601 with an offset");
  }
  if (fm.stale_after !== undefined && !ISO_DATETIME.test(String(fm.stale_after))) {
    report.fail(file, 1, "`stale_after` must be ISO 8601 with an offset");
  }
  for (const v of Array.isArray(fm.verified) ? fm.verified : []) {
    if (!ACTOR.test(String(v.by ?? "")) || !ISO_DATETIME.test(String(v.at ?? ""))) {
      report.fail(file, 1, "each `verified` entry needs an actor `by` and an ISO 8601 `at`");
    }
  }
  if (fm.external_claims !== undefined && typeof fm.external_claims !== "boolean") {
    report.fail(file, 1, "`external_claims` must be true or false");
  }
  const sources = Array.isArray(fm.sources) ? fm.sources : [];
  const ids = new Set();
  for (const s of sources) {
    const label = s.id ?? s.resource ?? "(unnamed)";
    if (!nonEmptyString(s.id)) report.fail(file, 1, `source ${label}: needs an \`id\` (footnote labels match it)`);
    else if (ids.has(s.id)) report.fail(file, 1, `source ${s.id}: duplicate id`);
    else ids.add(s.id);
    if (!/^https?:\/\/\S+$/.test(String(s.resource ?? ""))) report.fail(file, 1, `source ${label}: \`resource\` must be a public URL`);
    if (!retrievalDate(s)) report.fail(file, 1, `source ${label}: needs a retrieval date (\`last_modified\` ISO 8601, or a date in \`title\`)`);
  }
  if (fm.external_claims === true && sources.length === 0) {
    report.fail(file, 1, "`external_claims: true` needs at least one `sources` entry");
  }
  let inFence = false;
  parsed.body.split("\n").forEach((line, i) => {
    if (/^\s*(```|~~~)/.test(line)) inFence = !inFence;
    if (inFence) return;
    for (const id of footnoteRefs(line)) {
      if (!ids.has(id)) report.fail(file, parsed.bodyStartLine + i, `external claim [^${id}] has no matching \`sources\` entry`);
    }
  });
}

// ── (c) broken links ────────────────────────────────────────────────────────

function checkLinks(file, text, bundle, report) {
  const re = /\[[^\]]*\]\(([^)\s]+)\)/g;
  text.split("\n").forEach((line, i) => {
    let m;
    while ((m = re.exec(line))) {
      const target = m[1].split("#")[0];
      if (target === "" || /^(?:https?:|mailto:)/i.test(target)) continue;
      const abs = target.startsWith("/") ? join(bundle, target) : join(dirname(file), target);
      if (!existsSync(abs)) report.warn(file, i + 1, `broken link: ${m[1]}`);
    }
  });
}

// ── (d) secret, credential and personal-data patterns ──────────────────────

function loadAllowlist(path) {
  if (!existsSync(path)) return new Set();
  return new Set(
    readFileSync(path, "utf8")
      .split("\n")
      .map((l) => l.trim().toLowerCase())
      .filter((l) => l && !l.startsWith("#")),
  );
}

export function secretFindings(line, emailAllowlist) {
  const found = [];
  for (const { name, re } of SECRET_PATTERNS) if (re.test(line)) found.push(name);
  for (const email of line.match(EMAIL) ?? []) {
    if (!emailAllowlist.has(email.toLowerCase())) found.push("email address not in the allowlist");
  }
  for (const token of line.match(HIGH_ENTROPY_TOKEN) ?? []) {
    if (/\d/.test(token) && /[a-z]/.test(token) && /[A-Z]/.test(token) && shannon(token) >= ENTROPY_THRESHOLD) {
      found.push("long high-entropy string");
    }
  }
  return found;
}

// ── (e) banned assertions ──────────────────────────────────────────────────

export function assertionFindings(line) {
  let text = line;
  for (const allowed of ALLOWED_SENTENCES) {
    text = text.replace(new RegExp(allowed.replace(/[-]/g, "\\-"), "gi"), "");
  }
  const found = [];
  for (const sentence of text.split(/(?<=[.!?])\s+/)) {
    for (const { name, re } of BANNED_ASSERTIONS) {
      const m = re.exec(sentence);
      if (m && !NEGATION.test(sentence.slice(0, m.index))) found.push(`${name}: "${m[0]}"`);
    }
  }
  return found;
}

export function run(argv) {
  const opts = parseArgs(argv);
  const report = new Report();
  const emailAllowlist = loadAllowlist(opts.emailAllowlist);

  if (!existsSync(opts.bundle)) report.fail(opts.bundle, 0, "knowledge bundle directory not found");
  for (const file of walk(opts.bundle)) {
    if (!file.endsWith(".md")) continue;
    const text = readFileSync(file, "utf8");
    const name = file.split(/[\\/]/).pop();
    if (name === "index.md") checkIndex(file, text, dirname(file) === opts.bundle, report);
    else if (name === "log.md") checkLog(file, text, report);
    else checkConcept(file, text, report);
    checkLinks(file, text, opts.bundle, report);
  }

  // Version placeholders: a source page may use {{v:<id>}} only for products the facts file knows; a
  // generated corpus page must have none left (the build resolved them).
  const facts = loadFacts(join(opts.bundle, "product-facts.json"));
  for (const file of walk(opts.bundle)) {
    if (!file.endsWith(".md")) continue;
    const text = readFileSync(file, "utf8");
    if (!hasPlaceholders(text)) continue;
    for (const e of resolvePlaceholders(text, facts, file).errors) report.fail(file, 0, e);
  }
  for (const file of walk(opts.corpus)) {
    if (!file.endsWith(".md")) continue;
    readFileSync(file, "utf8").split("\n").forEach((line, i) => {
      if (hasPlaceholders(line)) report.fail(file, i + 1, "unresolved {{v:...}} version placeholder in the generated corpus");
    });
  }

  for (const file of [...walk(opts.bundle), ...walk(opts.corpus)]) {
    const ext = file.slice(file.lastIndexOf("."));
    if (!TEXT_EXTENSIONS.has(ext)) continue;
    readFileSync(file, "utf8")
      .split("\n")
      .forEach((line, i) => {
        for (const f of secretFindings(line, emailAllowlist)) report.fail(file, i + 1, `possible secret or personal data: ${f}`);
        if (ext === ".md") {
          for (const f of assertionFindings(line)) report.fail(file, i + 1, `banned assertion, ${f}`);
        }
      });
  }

  for (const name of FR8_FILES) {
    const path = join(opts.corpus, name);
    if (!existsSync(path)) report.fail(path, 0, "missing: the seed's FR-8 checks need this file");
  }

  for (const w of report.warnings) console.warn(`validate-kb: WARN ${w}`);
  for (const f of report.failures) console.error(`validate-kb: FAIL ${f}`);
  console.log(`validate-kb: ${report.failures.length} failure(s), ${report.warnings.length} warning(s)`);
  return report.failures.length ? 1 : 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    process.exitCode = run(process.argv.slice(2));
  } catch (e) {
    console.error(`validate-kb: ERROR: ${e.message}`);
    process.exitCode = 2;
  }
}
