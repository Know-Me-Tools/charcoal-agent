// SEED_MODE behaviour of scripts/seed-site-agent.sh, against a fake `curl`
// placed first on PATH. No network: the fake answers UAR's API from a state file.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { chmodSync, copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { CORPUS, REPO_ROOT, tempDir } from "./helpers.mjs";

const SEED = join(REPO_ROOT, "scripts/seed-site-agent.sh");

const FAKE_CURL = `#!/usr/bin/env node
const fs = require("node:fs");
const args = process.argv.slice(2);
let out = null, method = "GET", url = null, data = null;
const forms = [];
for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a === "-o") out = args[++i];
  else if (a === "-X") method = args[++i];
  else if (a === "-w" || a === "-H" || a === "--max-time") i++;
  else if (a === "-F") forms.push(args[++i]);
  else if (a === "--data-binary") data = args[++i];
  else if (/^https?:/.test(a)) url = a;
}
const path = new URL(url).pathname;
fs.appendFileSync(process.env.STUB_LOG, method + " " + path + "\\n");
const statePath = process.env.STUB_STATE;
const state = fs.existsSync(statePath) ? JSON.parse(fs.readFileSync(statePath, "utf8")) : { docs: [], n: 0 };
const body = data && data.startsWith("@") ? fs.readFileSync(data.slice(1), "utf8") : data;
let status = 200, reply = {};
const docsPath = /^\\/api\\/uar\\/knowledge-bases\\/kb-1\\/documents(?:\\/(.+))?$/;
if (method === "PUT" && path.startsWith("/api/agents/")) reply = {};
else if (path === "/api/uar/presentations" && method === "GET") reply = { presentations: [] };
else if (path === "/api/uar/presentations" && method === "POST") status = 201;
else if (path === "/api/uar/knowledge-bases" && method === "GET") reply = [{ id: "kb-1", name: "knowme-site" }];
else if (docsPath.test(path)) {
  const id = docsPath.exec(path)[1];
  if (method === "GET") reply = state.docs;
  else if (method === "POST") {
    const filename = /filename=([^;]+)/.exec(forms[0])[1];
    state.docs.push({ id: "doc-" + ++state.n, filename, status: "indexed" });
  } else if (method === "DELETE") state.docs = state.docs.filter((d) => d.id !== id);
} else if (path === "/api/uar/knowledge-bases/kb-1/search") {
  const q = JSON.parse(body).query;
  const idOf = (base) => (state.docs.find((d) => d.filename.startsWith(base + ".")) || {}).id || "none";
  if (q.includes("IPFS")) reply = { results: [{ content: "IPFS Sync for Obsidian is at v0.2.0 and needs Obsidian 1.12.3 or later.", score: 0.6, document_id: idOf("ipfs-sync-for-obsidian") }] };
  else reply = { results: [{ content: "The Boss runs on Windows and macOS.", score: 0.6, document_id: idOf("the-boss") }] };
} else status = 404;
fs.writeFileSync(statePath, JSON.stringify(state));
if (out) fs.writeFileSync(out, JSON.stringify(reply));
process.stdout.write(String(status));
`;

function bashMajor() {
  const r = spawnSync("bash", ["-c", 'echo "${BASH_VERSINFO[0]}"'], { encoding: "utf8" });
  return Number(r.stdout.trim());
}
const tools = ["jq", "openssl"].every((t) => spawnSync("bash", ["-c", `command -v ${t}`]).status === 0);
const skip = bashMajor() < 4 ? "seed script needs bash 4 or later" : !tools ? "seed script needs jq and openssl" : false;

function seed(mode, { withBoss = true } = {}) {
  const dir = tempDir("seed");
  const bin = join(dir, "bin");
  mkdirSync(bin);
  writeFileSync(join(bin, "curl"), FAKE_CURL);
  chmodSync(join(bin, "curl"), 0o755);
  const corpus = join(dir, "corpus");
  mkdirSync(corpus);
  for (const name of ["ipfs-sync-for-obsidian.md", "faq.md", ...(withBoss ? ["the-boss.md"] : [])]) {
    copyFileSync(join(CORPUS, name), join(corpus, name));
  }
  const presentations = join(dir, "presentations");
  mkdirSync(presentations);
  writeFileSync(join(presentations, "card.json"), JSON.stringify({ title: "Answer card" }));
  writeFileSync(join(dir, "agent.json"), JSON.stringify({ id: "knowme-site" }));
  const env = { ...process.env };
  for (const k of ["SITE_GATE_TOKEN_URL", "SITE_GATE_CLIENT_ID", "SITE_GATE_CLIENT_SECRET", "SEED_MODE"]) delete env[k];
  Object.assign(env, {
    PATH: `${bin}:${process.env.PATH}`,
    STUB_LOG: join(dir, "calls.log"),
    STUB_STATE: join(dir, "state.json"),
    UAR_URL: "http://uar.stub.invalid",
    // Not a credential: signs a token only the fake curl receives.
    UAR_JWT_SECRET: ["seed", "test", "only"].join("-"),
    AGENT_FILE: join(dir, "agent.json"),
    CORPUS_DIR: corpus,
    PRESENTATIONS_DIR: presentations,
    INGEST_WAIT_SECS: "5",
    FR8_SEARCH_RETRY_SECS: "0",
    ...(mode ? { SEED_MODE: mode } : {}),
  });
  const r = spawnSync("bash", [SEED], { cwd: REPO_ROOT, env, encoding: "utf8" });
  const calls = existsSync(env.STUB_LOG) ? readFileSync(env.STUB_LOG, "utf8") : "";
  return { status: r.status, stderr: r.stderr, calls };
}

test("the seed script parses (bash -n)", { skip }, () => {
  const r = spawnSync("bash", ["-n", SEED], { encoding: "utf8" });
  assert.equal(r.status, 0, r.stderr);
});

test("SEED_MODE=kb syncs the KB and makes no agent or template call", { skip }, () => {
  const r = seed("kb");
  assert.equal(r.status, 0, r.stderr);
  assert.doesNotMatch(r.calls, /\/api\/agents/);
  assert.doesNotMatch(r.calls, /\/api\/uar\/presentations/);
  assert.match(r.calls, /POST \/api\/uar\/knowledge-bases\/kb-1\/documents/);
  assert.match(r.calls, /POST \/api\/uar\/knowledge-bases\/kb-1\/search/);
  assert.match(r.stderr, /FR-8 KB health check passed/);
});

test("SEED_MODE=agent puts the agent and templates and makes no KB call", { skip }, () => {
  const r = seed("agent");
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.calls, /PUT \/api\/agents\/knowme-site/);
  assert.match(r.calls, /POST \/api\/uar\/presentations/);
  assert.doesNotMatch(r.calls, /knowledge-bases/);
});

test("the default mode (all) does both", { skip }, () => {
  const r = seed(null);
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.calls, /PUT \/api\/agents\/knowme-site/);
  assert.match(r.calls, /POST \/api\/uar\/presentations/);
  assert.match(r.calls, /POST \/api\/uar\/knowledge-bases\/kb-1\/search/);
  assert.match(r.stderr, /FR-8 KB health check passed/);
});

test("a missing the-boss.md fails the FR-8 step instead of skipping it", { skip }, () => {
  const r = seed("kb", { withBoss: false });
  assert.notEqual(r.status, 0, r.stderr);
  assert.match(r.stderr, /the-boss\.md is missing; the check cannot run/);
  assert.match(r.stderr, /FR-8 KB health check failed/);
});

test("an unknown SEED_MODE is rejected before any call", { skip }, () => {
  const r = seed("everything");
  assert.notEqual(r.status, 0);
  assert.match(r.stderr, /SEED_MODE must be kb, agent or all/);
  assert.equal(r.calls, "");
});
