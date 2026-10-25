#!/usr/bin/env node
// Helper for scripts/ops/check-candidate-agent.sh. Two subcommands:
//
//   prepare --agent <file> --web <file> --out-dir <dir>
//     Writes candidate copies of the two agent artifacts. Only the top-level `id` (and the title)
//     change; the KB name `knowme-site` inside the file is left alone, because the candidates read
//     the same knowledge base. Prints nothing but the two candidate ids.
//
//   run --base <url> --auth-file <file> --scenarios <file> --out-dir <dir>
//       --agent <file> --web <file> --corpus <dir>[,<dir>...] [--only <id>[,<id>...]] [--timeout <secs>]
//     Sends each scenario to the candidate agents as one chat request, in the shape the site server
//     forwards (server/src/domain/chat_request.rs), stores transcripts, applies the assertions in the
//     scenario file and prints a table. The auth file holds one header line, `Authorization: Bearer
//     <token>`, as written by the shell script; it is read here and never printed or stored.
//
// Exit codes (run): 0 all pass, 1 a CRITICAL FAIL, 2 a FAIL (pass criterion) and no critical,
// 3 a run did not complete (ERROR) and nothing worse.

import { randomUUID } from "node:crypto";
import { mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const CANDIDATE_IDS = Object.freeze({
  default: "knowme-site-candidate",
  web: "knowme-site-web-candidate",
});
const PRODUCTION_IDS = Object.freeze(["knowme-site", "knowme-site-web"]);
const LEAK_NGRAM = 8;

function arg(argv, name, fallback) {
  const i = argv.indexOf(`--${name}`);
  if (i === -1) return fallback;
  const v = argv[i + 1];
  if (v === undefined || v.startsWith("--")) throw new Error(`--${name} needs a value`);
  return v;
}
function need(argv, name) {
  const v = arg(argv, name);
  if (!v) throw new Error(`--${name} is required`);
  return v;
}

// ── prepare ─────────────────────────────────────────────────────────────────
function prepare(argv) {
  const outDir = need(argv, "out-dir");
  mkdirSync(outDir, { recursive: true });
  const sources = { default: need(argv, "agent"), web: need(argv, "web") };
  for (const [kind, file] of Object.entries(sources)) {
    const art = JSON.parse(readFileSync(file, "utf8"));
    if (art.kind !== "agent" || typeof art.id !== "string") throw new Error(`${file} is not an agent artifact`);
    const candidate = {
      ...art,
      id: CANDIDATE_IDS[kind],
      metadata: { ...art.metadata, title: `${art.metadata?.title ?? art.id} (candidate, pre-merge check)` },
    };
    if (PRODUCTION_IDS.includes(candidate.id) || !Object.values(CANDIDATE_IDS).includes(candidate.id)) {
      throw new Error(`refusing: candidate id '${candidate.id}' is not a candidate id`);
    }
    writeFileSync(join(outDir, `${CANDIDATE_IDS[kind]}.json`), `${JSON.stringify(candidate, null, 2)}\n`);
  }
  process.stdout.write(`${CANDIDATE_IDS.default} ${CANDIDATE_IDS.web}\n`);
}

// ── text analysis ───────────────────────────────────────────────────────────
export function splitReply(text) {
  const prose = [];
  const code = [];
  let inFence = false;
  for (const line of text.split(/\r?\n/)) {
    if (/^\s*```/.test(line)) {
      inFence = !inFence;
      continue;
    }
    (inFence ? code : prose).push(line);
  }
  return { proseLines: prose.filter((l) => l.trim()), codeLines: code, codeText: code.join("\n"), proseText: prose.join("\n") };
}

const words = (s) => (s.match(/\S+/g) ?? []).length;
const sentences = (s) => s.split(/(?<=[.!?])\s+|\n+/).map((x) => x.trim()).filter(Boolean);
const normWords = (s) => s.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter(Boolean);

function loadCorpus(dirs) {
  const parts = [];
  const walk = (dir) => {
    let entries = [];
    try {
      entries = readdirSync(dir);
    } catch {
      return;
    }
    for (const name of entries) {
      const p = join(dir, name);
      const st = statSync(p);
      if (st.isDirectory()) walk(p);
      else if (/\.(md|json)$/.test(name)) parts.push(readFileSync(p, "utf8"));
    }
  };
  dirs.forEach(walk);
  return parts.join("\n").toLowerCase();
}

const NODE_BUILTINS = new Set(["fs", "path", "http", "https", "os", "crypto", "util", "events", "stream", "url", "readline", "child_process", "zlib", "net", "tls", "buffer", "assert"]);

function extractIdentifiers(reply, codeText) {
  const ids = new Set();
  for (const m of reply.matchAll(/(?:^|[\s"'`(=])(\/(?:api|v1|v2)\/[A-Za-z0-9_\-./{}:]+)/gm)) {
    ids.add(m[1].replace(/[.,;)]+$/, "").split(/[{:]/)[0].replace(/\/$/, ""));
  }
  for (const m of reply.matchAll(/(?:npm (?:i|install)|pnpm (?:add|install)|yarn add|pip3? install|cargo add|go get)\s+(?:-\S+\s+)*(@?[\w./-]+)/g)) ids.add(m[1]);
  for (const m of codeText.matchAll(/(?:from\s+|require\(\s*)['"]([^'".][^'"]*)['"]/g)) {
    const spec = m[1].replace(/^node:/, "");
    const root = spec.startsWith("@") ? spec.split("/").slice(0, 2).join("/") : spec.split("/")[0];
    if (!NODE_BUILTINS.has(root)) ids.add(root);
  }
  return [...ids].filter(Boolean);
}

function re(pattern, flags, extra = "") {
  return new RegExp(pattern, (flags ?? "i") + extra);
}

// Returns { ok, detail }. `ctx`: { reply, citations, corpus, promptWords }.
// Words of the public product list, plus connectors. A run made only of these is the product
// list, which the prompt tells the model to say, not a leak.
const PRODUCT_VOCAB = new Set("knowme the boss ipfs sync for obsidian universal agent runtime bossfang surreal memory server prometheus skill packages ags llc ai and of by".split(" "));
// Phrases the prompt instructs the model to say. A run inside one of these is not a leak.
const INSTRUCTED_PHRASES = [
  "the real api is not documented in the knowledge base",
  "the knowledge base does not state",
  "pricing is not published yet",
  "i am an ai concierge",
].map((p) => normWords(p));

// First maximal run (>= LEAK_NGRAM words) copied from the prompt that is not product-list-only or
// instructed phrasing; null when none.
export function findLeakRun(w, promptWords) {
  const covered = new Array(w.length).fill(false);
  for (let i = 0; i + LEAK_NGRAM <= w.length; i++) {
    if (promptWords.has(w.slice(i, i + LEAK_NGRAM).join(" "))) for (let k = i; k < i + LEAK_NGRAM; k++) covered[k] = true;
  }
  const exempt = w.map((x) => PRODUCT_VOCAB.has(x));
  for (const ph of INSTRUCTED_PHRASES) {
    for (let i = 0; i + ph.length <= w.length; i++) {
      if (ph.every((x, k) => w[i + k] === x)) for (let k = i; k < i + ph.length; k++) exempt[k] = true;
    }
  }
  for (let i = 0; i < w.length; ) {
    if (!covered[i]) {
      i++;
      continue;
    }
    let j = i;
    while (j < w.length && covered[j]) j++;
    if (!w.slice(i, j).every((_, k) => exempt[i + k])) return w.slice(i, j);
    i = j;
  }
  return null;
}

export function evaluate(a, ctx) {
  const { reply } = ctx;
  const parts = splitReply(reply);
  switch (a.type) {
    case "any_of":
      return { ok: a.of.some((sub) => evaluate(sub, ctx).ok), detail: "none of the alternatives held" };
    case "matches":
      return { ok: re(a.pattern, a.flags).test(reply), detail: "no match" };
    case "not_matches": {
      const skip = a.skip_sentences ? re(a.skip_sentences, a.flags) : null;
      const subject = skip ? sentences(reply).filter((x) => !skip.test(x)).join("\n") : reply;
      const m = re(a.pattern, a.flags).exec(subject);
      return { ok: !m, detail: m ? `found "${m[0].slice(0, 60)}"` : "" };
    }
    case "matches_any":
      return { ok: a.patterns.some((p) => re(p, a.flags).test(reply)), detail: "none of the patterns matched" };
    case "question_count": {
      const n = (parts.proseText.match(/\?/g) ?? []).length;
      return { ok: n >= a.min && n <= a.max, detail: `${n} question marks` };
    }
    case "max_words": {
      const n = words(parts.proseText);
      return { ok: n <= a.n, detail: `${n} words` };
    }
    case "max_prose_lines":
      return { ok: parts.proseLines.length <= a.n, detail: `${parts.proseLines.length} lines` };
    case "max_code_lines":
      return { ok: parts.codeLines.length <= a.n, detail: `${parts.codeLines.length} code lines` };
    case "max_numbered_items": {
      const n = parts.proseLines.filter((l) => /^\s*\d+[.)]\s/.test(l)).length;
      return { ok: n <= a.n, detail: `${n} numbered items` };
    }
    case "cited": {
      const ok = /\[\d+\]/.test(reply) || ctx.citations > 0;
      return { ok, detail: "no [n] marker and no citation event" };
    }
    case "identifiers_in_kb": {
      const allow = new Set((a.allow ?? []).map((s) => s.toLowerCase()));
      const missing = extractIdentifiers(reply, parts.codeText).filter((id) => !allow.has(id.toLowerCase()) && !ctx.corpus.includes(id.toLowerCase()));
      return { ok: missing.length === 0, detail: missing.length ? `not in knowledge base: ${missing.join(", ")}` : "" };
    }
    case "phrases_in_kb": {
      const missing = new Set();
      for (const p of a.patterns) {
        for (const m of reply.matchAll(new RegExp(p, "g"))) {
          if (!ctx.corpus.includes(m[0].trim().toLowerCase())) missing.add(m[0].trim());
        }
      }
      return { ok: missing.size === 0, detail: missing.size ? `not in knowledge base: ${[...missing].join(", ")}` : "" };
    }
    case "sentences_with": {
      const hit = re(a.pattern, a.flags);
      const req = re(a.require, a.flags);
      const alt = a.allow ? re(a.allow, a.flags) : null;
      const sup = a.supported ? re(a.supported, a.flags) : null;
      const bad = sentences(parts.proseText).filter((s) => hit.test(s) && !req.test(s) && !(alt && alt.test(s)) && !(sup && sup.test(s)));
      return { ok: bad.length === 0, detail: bad.length ? `unmarked: "${bad[0].slice(0, 90)}"` : "" };
    }
    case "no_prompt_leak": {
      const run = findLeakRun(normWords(reply), ctx.promptWords);
      return { ok: !run, detail: run ? `8-word run from the prompt near "${run.slice(0, 4).join(" ")}"` : "" };
    }
    default:
      throw new Error(`unknown assertion type: ${a.type}`);
  }
}

// ── stream ──────────────────────────────────────────────────────────────────
export function parseSse(raw) {
  const out = { text: "", citations: 0, events: {}, done: false, errored: false, closed: false };
  for (const block of raw.replace(/\r/g, "").split("\n\n")) {
    if (!block.trim()) continue;
    let event = "message";
    let data = "";
    for (const line of block.split("\n")) {
      if (line.startsWith("event:")) event = line.slice(6).trim();
      else if (line.startsWith("data:")) data = line.slice(5).trim();
    }
    if (data === "[DONE]") {
      out.closed = true;
      continue;
    }
    if (block.startsWith("event:") || event !== "message") out.events[event] = (out.events[event] ?? 0) + 1;
    if (event === "agui.error" || /^\{"error"/.test(data)) out.errored = true;
    if (event === "agui.done") out.done = true;
    if (event === "agui.citation.added") out.citations += 1;
    if (event === "agui.message.delta" && data) {
      try {
        const t = JSON.parse(data)?.delta?.text;
        if (typeof t === "string") out.text += t;
      } catch {
        /* a malformed frame carries no text */
      }
    }
  }
  return out;
}

async function ask({ base, headers, agentId, message, timeoutMs }) {
  const body = {
    agent_id: agentId,
    message,
    stream: true,
    stream_mode: "dual",
    memory_enabled: false,
    presentation_mode: "a2ui",
    client_rendering: { a2ui_profiles: ["uar.a2ui/1"] },
  };
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), timeoutMs);
  try {
    const res = await fetch(`${base}/api/chat/completion`, {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json", "X-UAR-Session-ID": randomUUID() },
      body: JSON.stringify(body),
      signal: ctl.signal,
    });
    const raw = await res.text();
    return { status: res.status, raw, aborted: false };
  } catch (e) {
    return { status: 0, raw: "", aborted: true, error: e.name === "AbortError" ? "timeout" : e.message };
  } finally {
    clearTimeout(timer);
  }
}

// ── run ─────────────────────────────────────────────────────────────────────
function readAuthHeader(file) {
  const line = readFileSync(file, "utf8").split("\n").find((l) => /^authorization:/i.test(l));
  if (!line) throw new Error("auth file has no Authorization header");
  return { Authorization: line.replace(/^authorization:\s*/i, "").trim() };
}

function promptNgrams(agentFile) {
  const prompt = JSON.parse(readFileSync(agentFile, "utf8")).prompt?.system ?? "";
  const w = normWords(prompt);
  const set = new Set();
  for (let i = 0; i + LEAK_NGRAM <= w.length; i++) set.add(w.slice(i, i + LEAK_NGRAM).join(" "));
  return set;
}

function classify(results, runOk) {
  if (!runOk) return "ERROR";
  if (results.some((r) => !r.ok && r.kind === "critical")) return "CRITICAL FAIL";
  if (results.some((r) => !r.ok)) return "FAIL";
  return "PASS";
}

async function run(argv) {
  const base = need(argv, "base").replace(/\/$/, "");
  const headers = readAuthHeader(need(argv, "auth-file"));
  const spec = JSON.parse(readFileSync(need(argv, "scenarios"), "utf8"));
  const outDir = need(argv, "out-dir");
  const timeoutMs = Number(arg(argv, "timeout", "150")) * 1000;
  const only = arg(argv, "only", "") ? arg(argv, "only").split(",") : null;
  const corpus = loadCorpus(need(argv, "corpus").split(","));
  const promptWords = { default: promptNgrams(need(argv, "agent")), web: promptNgrams(need(argv, "web")) };
  if (corpus.length < 1000) throw new Error("knowledge corpus is empty: check --corpus");
  mkdirSync(join(outDir, "transcripts"), { recursive: true });

  const rows = [];
  for (const sc of spec.scenarios) {
    if (only && !only.includes(sc.id)) continue;
    for (const kind of sc.agents) {
      const agentId = CANDIDATE_IDS[kind];
      if (!agentId || PRODUCTION_IDS.includes(agentId)) throw new Error(`bad agent kind '${kind}'`);
      process.stderr.write(`[check-candidate-agent] ${sc.id} -> ${agentId}\n`);
      const t0 = Date.now();
      const resp = await ask({ base, headers, agentId, message: sc.prompt, timeoutMs });
      const sse = parseSse(resp.raw);
      const complete = resp.status >= 200 && resp.status < 300 && sse.done && sse.closed && !sse.errored && sse.text.trim().length > 0;
      const ctx = { reply: sse.text, citations: sse.citations, corpus, promptWords: promptWords[kind] };
      const all = [...(spec.global_assertions ?? []), ...sc.assertions].filter((a) => !a.agents || a.agents.includes(kind));
      const results = complete
        ? all.map((a) => {
            const r = evaluate(a, ctx);
            return { id: a.id, kind: a.kind, label: a.label, ok: r.ok, detail: r.ok ? "" : r.detail };
          })
        : [];
      const status = classify(results, complete);
      const parts = splitReply(sse.text);
      const row = {
        scenario: sc.id,
        agent: kind,
        agent_id: agentId,
        http: resp.status,
        status,
        words: words(parts.proseText),
        seconds: Math.round((Date.now() - t0) / 100) / 10,
        failed: results.filter((r) => !r.ok).map((r) => `${r.kind === "critical" ? "CRIT " : ""}${r.id}${r.detail ? ` (${r.detail})` : ""}`),
        incomplete: complete ? null : resp.aborted ? `request ${resp.error}` : `HTTP ${resp.status}, done=${sse.done}, closed=${sse.closed}, error=${sse.errored}`,
      };
      rows.push(row);
      writeFileSync(
        join(outDir, "transcripts", `${sc.id}.${kind}.json`),
        `${JSON.stringify({ ...row, prompt: sc.prompt, pass_criteria: sc.pass, critical_fail_criteria: sc.critical_fail, events: sse.events, citation_events: sse.citations, reply: sse.text, assertions: results }, null, 2)}\n`,
      );
    }
  }

  writeFileSync(join(outDir, "summary.json"), `${JSON.stringify(rows, null, 2)}\n`);
  const pad = (s, n) => String(s).padEnd(n);
  const lines = [`${pad("SCENARIO", 30)}${pad("AGENT", 9)}${pad("WORDS", 7)}${pad("RESULT", 15)}DETAIL`];
  for (const r of rows) lines.push(`${pad(r.scenario, 30)}${pad(r.agent, 9)}${pad(r.words, 7)}${pad(r.status, 15)}${r.incomplete ?? r.failed.join("; ")}`);
  const count = (s) => rows.filter((r) => r.status === s).length;
  lines.push("", `PASS ${count("PASS")}  FAIL ${count("FAIL")}  CRITICAL FAIL ${count("CRITICAL FAIL")}  ERROR ${count("ERROR")}  (of ${rows.length} runs)`);
  const table = `${lines.join("\n")}\n`;
  writeFileSync(join(outDir, "summary.txt"), table);
  process.stdout.write(table);
  if (count("CRITICAL FAIL")) return 1;
  if (count("FAIL")) return 2;
  if (count("ERROR")) return 3;
  return 0;
}

// Re-evaluates saved transcripts against the current scenario file. No network, no agents.
//   replay --scenarios <file> --dir <transcripts dir> --corpus <dir>[,<dir>] [--agent <file> --web <file>]
// Without --agent/--web the prompt-leak check is skipped (it passes).
function replay(argv) {
  const spec = JSON.parse(readFileSync(need(argv, "scenarios"), "utf8"));
  const dir = need(argv, "dir");
  const corpus = loadCorpus(need(argv, "corpus").split(","));
  const af = arg(argv, "agent");
  const wf = arg(argv, "web");
  const promptWords = { default: af ? promptNgrams(af) : new Set(), web: wf ? promptNgrams(wf) : new Set() };
  let worst = 0;
  for (const sc of spec.scenarios) {
    for (const kind of sc.agents) {
      let t;
      try {
        t = JSON.parse(readFileSync(join(dir, `${sc.id}.${kind}.json`), "utf8"));
      } catch {
        continue;
      }
      const ctx = { reply: t.reply, citations: t.citation_events ?? 0, corpus, promptWords: promptWords[kind] };
      const all = [...(spec.global_assertions ?? []), ...sc.assertions].filter((a) => !a.agents || a.agents.includes(kind));
      const results = all.map((a) => ({ ...a, ...evaluate(a, ctx) }));
      const status = classify(results, true);
      worst = Math.max(worst, status === "CRITICAL FAIL" ? 1 : status === "FAIL" ? 2 : 0);
      const failed = results.filter((r) => !r.ok).map((r) => `${r.kind === "critical" ? "CRIT " : ""}${r.id} (${r.detail})`);
      process.stdout.write(`${sc.id.padEnd(30)}${kind.padEnd(9)}${status.padEnd(15)}${failed.join("; ")}\n`);
    }
  }
  return worst;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [cmd, ...rest] = process.argv.slice(2);
  try {
    if (cmd === "replay") process.exitCode = replay(rest);
    else if (cmd === "prepare") prepare(rest);
    else if (cmd === "run") process.exitCode = await run(rest);
    else throw new Error("usage: check-candidate-agent.mjs prepare|run ...");
  } catch (e) {
    process.stderr.write(`[check-candidate-agent] ERROR: ${e.message}\n`);
    process.exitCode = 64;
  }
}
