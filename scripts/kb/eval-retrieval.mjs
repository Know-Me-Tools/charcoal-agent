#!/usr/bin/env node
// Retrieval evaluation for the site knowledge base (site-kb-content-pipeline
// task 2.5). For each question it calls UAR's KB search the same way the seed's
// FR-8 checks do (scripts/seed-site-agent.sh, search_kb):
//   POST {UAR_BASE_URL}/api/uar/knowledge-bases/{KB_ID}/search
//   Authorization: Bearer {UAR_TOKEN}
//   {"query": <question>, "limit": <top-k>, "min_score": <min-score>}
// and maps each result's document_id to its uploaded file name through
//   GET {UAR_BASE_URL}/api/uar/knowledge-bases/{KB_ID}/documents
// stripping the seed's `.<12-hex>` content-hash suffix.
//
// A question passes when its expect_file is among the top-k source files and,
// if expect_contains is set (a string or a list), each string appears in a
// top-k chunk from that file. Prints the top-k source names and PASS/FAIL per
// question, then recall@k. Exits 1 when recall is below --min-recall or any
// question marked `critical: true` fails; 2 on a configuration or HTTP error.
// The token is read from the environment and never printed.
//
// Usage:
//   UAR_BASE_URL=http://127.0.0.1:6565 KB_ID=<id> UAR_TOKEN=<token> \
//     node scripts/kb/eval-retrieval.mjs [--questions <file>] [--min-recall 0.9]
//     [--top-k 5] [--min-score 0.3] [--verbose]
// Set KB_NAME instead of KB_ID to resolve the knowledge base by name.

import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const HASH_SUFFIX = /^(.*)\.[0-9a-f]{12}\.md$/;
const SEARCH_ATTEMPTS = 3;
const RETRY_DELAY_MS = 2000;
const REQUEST_TIMEOUT_MS = 60_000;

export function parseArgs(argv) {
  const opts = {
    questions: join(REPO_ROOT, "docs/knowledge-source/eval/questions.json"),
    minRecall: 0.9,
    topK: 5,
    // Same as the seed's FR8_MIN_SCORE: tests retrieval routing, not UAR's chat threshold.
    minScore: 0.3,
    retryDelayMs: RETRY_DELAY_MS,
    verbose: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const next = () => {
      if (i + 1 >= argv.length) throw new Error(`${a} needs a value`);
      return argv[++i];
    };
    const num = (v) => {
      const n = Number(v);
      if (!Number.isFinite(n)) throw new Error(`${a} needs a number`);
      return n;
    };
    if (a === "--questions") opts.questions = resolve(next());
    else if (a === "--min-recall") opts.minRecall = num(next());
    else if (a === "--top-k") opts.topK = num(next());
    else if (a === "--min-score") opts.minScore = num(next());
    else if (a === "--retry-delay-ms") opts.retryDelayMs = num(next());
    else if (a === "--verbose") opts.verbose = true;
    else throw new Error(`unknown argument: ${a}`);
  }
  return opts;
}

export function loadQuestions(path) {
  const list = JSON.parse(readFileSync(path, "utf8"));
  if (!Array.isArray(list) || list.length === 0) throw new Error(`${path}: expected a non-empty array`);
  return list.map((q, n) => {
    if (typeof q?.question !== "string" || typeof q?.expect_file !== "string") {
      throw new Error(`${path}: item ${n} needs string question and expect_file`);
    }
    const contains = q.expect_contains === undefined ? [] : [q.expect_contains].flat();
    if (contains.some((c) => typeof c !== "string")) throw new Error(`${path}: item ${n} expect_contains must be strings`);
    return { question: q.question, expectFile: q.expect_file, contains, critical: q.critical === true };
  });
}

/** Uploaded name `<base>.<12-hex>.md` back to the corpus file name `<base>.md`. */
export function sourceName(filename) {
  const m = HASH_SUFFIX.exec(filename ?? "");
  return m ? `${m[1]}.md` : (filename ?? "(unknown)");
}

function client({ baseUrl, kbId, token, retryDelayMs }) {
  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
  const base = `${baseUrl.replace(/\/+$/, "")}/api/uar/knowledge-bases/${encodeURIComponent(kbId)}`;
  async function call(method, path, body) {
    for (let attempt = 1; ; attempt++) {
      let res;
      try {
        res = await fetch(`${base}${path}`, {
          method,
          headers,
          body: body === undefined ? undefined : JSON.stringify(body),
          signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        });
      } catch (e) {
        if (attempt < SEARCH_ATTEMPTS) {
          await new Promise((r) => setTimeout(r, retryDelayMs));
          continue;
        }
        throw new Error(`${method} ${path}: ${e.message}`);
      }
      // Like the seed: a first search after ingestion can answer 408; retry it and 5xx.
      if ((res.status === 408 || res.status >= 500) && attempt < SEARCH_ATTEMPTS) {
        await new Promise((r) => setTimeout(r, retryDelayMs));
        continue;
      }
      if (!res.ok) throw new Error(`${method} ${path}: HTTP ${res.status}`);
      return res.json();
    }
  }
  return {
    documents: () => call("GET", "/documents"),
    search: (query, limit, minScore) => call("POST", "/search", { query, limit, min_score: minScore }),
  };
}

export async function run(argv, env = process.env, out = console) {
  const opts = parseArgs(argv);
  const missing = ["UAR_BASE_URL", "UAR_TOKEN"].filter((k) => !env[k]);
  if (!env.KB_ID && !env.KB_NAME) missing.push("KB_ID (or KB_NAME)");
  if (missing.length) throw new Error(`set ${missing.join(", ")}`);
  const questions = loadQuestions(opts.questions);
  let kbId = env.KB_ID;
  if (!kbId) {
    // Resolve the knowledge base by name, the way the seed does.
    const res = await fetch(`${env.UAR_BASE_URL.replace(/\/+$/, "")}/api/uar/knowledge-bases`, {
      headers: { Authorization: `Bearer ${env.UAR_TOKEN}` },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    if (!res.ok) throw new Error(`GET /api/uar/knowledge-bases: HTTP ${res.status}`);
    const list = await res.json();
    const found = (Array.isArray(list) ? list : list?.items ?? []).find((k) => k?.name === env.KB_NAME);
    if (!found?.id) throw new Error(`knowledge base named ${JSON.stringify(env.KB_NAME)} not found`);
    kbId = found.id;
  }
  const api = client({ baseUrl: env.UAR_BASE_URL, kbId, token: env.UAR_TOKEN, retryDelayMs: opts.retryDelayMs });

  const docs = await api.documents();
  const nameById = new Map((Array.isArray(docs) ? docs : []).map((d) => [d.id, sourceName(d.filename)]));

  let passed = 0;
  let criticalFailed = 0;
  for (const q of questions) {
    const reply = await api.search(q.question, opts.topK, opts.minScore);
    const results = (Array.isArray(reply?.results) ? reply.results : []).slice(0, opts.topK);
    const named = results.map((r) => ({
      name: nameById.get(r.document_id) ?? sourceName(r.metadata?.filename ?? r.metadata?.document_name),
      content: typeof r.content === "string" ? r.content : "",
      score: typeof r.score === "number" ? r.score : null,
    }));
    const fromExpected = named.filter((r) => r.name === q.expectFile);
    const missingText = q.contains.filter((c) => !fromExpected.some((r) => r.content.includes(c)));
    const ok = fromExpected.length > 0 && missingText.length === 0;
    if (ok) passed++;
    else if (q.critical) criticalFailed++;
    out.log(`${ok ? "PASS" : "FAIL"}${q.critical ? " [critical]" : ""}: ${q.question}`);
    out.log(`  expected: ${q.expectFile}${q.contains.length ? ` containing ${q.contains.map((c) => JSON.stringify(c)).join(", ")}` : ""}`);
    out.log(`  top-${opts.topK}: ${named.length ? named.map((r) => r.name).join(", ") : "(no results)"}`);
    if (opts.verbose) {
      for (const [n, r] of named.entries()) {
        const head = r.content.replace(/\s+/g, " ").slice(0, 130);
        out.log(`    #${n + 1} ${r.name}${r.score === null ? "" : ` (${r.score.toFixed(2)})`}: ${head}`);
      }
    }
    if (fromExpected.length && missingText.length) out.log(`  missing text: ${missingText.map((c) => JSON.stringify(c)).join(", ")}`);
  }
  const recall = passed / questions.length;
  out.log(`recall@${opts.topK}: ${passed}/${questions.length} = ${recall.toFixed(3)} (minimum ${opts.minRecall})`);
  if (criticalFailed) out.log(`critical failures: ${criticalFailed}`);
  return recall < opts.minRecall || criticalFailed > 0 ? 1 : 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  run(process.argv.slice(2)).then(
    (code) => {
      process.exitCode = code;
    },
    (e) => {
      console.error(`eval-retrieval: ERROR: ${e.message}`);
      process.exitCode = 2;
    },
  );
}
