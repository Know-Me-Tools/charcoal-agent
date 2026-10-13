import assert from "node:assert/strict";
import { createServer } from "node:http";
import { test } from "node:test";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { run } from "../eval-retrieval.mjs";

// The two FR-8 questions, copied from the committed question set so these tests
// keep working when more questions are added to docs/knowledge-source/eval.
const COMMITTED = JSON.parse(
  readFileSync(new URL("../../../docs/knowledge-source/eval/questions.json", import.meta.url), "utf8"),
);
const FR8 = (Array.isArray(COMMITTED) ? COMMITTED : COMMITTED.questions).filter(
  (q) => q.expect_file === "ipfs-sync-for-obsidian.md" || q.expect_file === "the-boss.md",
);
const QUESTIONS_FILE = join(mkdtempSync(join(tmpdir(), "kb-eval-")), "questions.json");
writeFileSync(QUESTIONS_FILE, JSON.stringify(Array.isArray(COMMITTED) ? FR8 : { ...COMMITTED, questions: FR8 }));

const KB = "kb-test";
// Not a credential: a stub value assembled at runtime.
const TOKEN = ["stub", "bearer", "value"].join("-");

const DOCS = [
  { id: "d-boss", filename: "the-boss.0123456789ab.md" },
  { id: "d-ipfs", filename: "ipfs-sync-for-obsidian.abcdefabcdef.md" },
  { id: "d-faq", filename: "faq.111111111111.md" },
];

/** A stub UAR KB API. `mode` decides whether search returns the expected files. */
async function stub(mode) {
  const requests = [];
  const server = createServer((req, res) => {
    let body = "";
    req.on("data", (c) => (body += c));
    req.on("end", () => {
      requests.push({ method: req.method, url: req.url, auth: req.headers.authorization, body });
      if (req.headers.authorization !== `Bearer ${TOKEN}`) {
        res.writeHead(401).end();
        return;
      }
      res.setHeader("Content-Type", "application/json");
      if (req.method === "GET" && req.url === "/api/uar/knowledge-bases") {
        res.end(JSON.stringify([{ id: "other", name: "other" }, { id: KB, name: "knowme-site" }]));
        return;
      }
      if (req.method === "GET" && req.url === `/api/uar/knowledge-bases/${KB}/documents`) {
        res.end(JSON.stringify(DOCS));
        return;
      }
      if (req.method === "POST" && req.url === `/api/uar/knowledge-bases/${KB}/search`) {
        const { query } = JSON.parse(body);
        const faq = { document_id: "d-faq", content: "Questions people ask.", score: 0.4 };
        let results = [faq, faq, faq, faq, faq];
        if (mode === "pass" && query.includes("IPFS")) {
          results = [
            faq,
            { document_id: "d-ipfs", content: "IPFS Sync for Obsidian is at v0.2.0.", score: 0.6 },
            { document_id: "d-ipfs", content: "It needs Obsidian 1.12.3 or later.", score: 0.55 },
          ];
        }
        if (mode === "pass" && query.includes("The Boss")) {
          results = [{ document_id: "d-boss", content: "The Boss runs on Windows and macOS.", score: 0.6 }, faq];
        }
        // A sixth result must be ignored: only the top 5 count.
        if (mode === "sixth") results = [faq, faq, faq, faq, faq, { document_id: "d-boss", content: "Windows macOS", score: 0.1 }];
        res.end(JSON.stringify({ results }));
        return;
      }
      res.writeHead(404).end();
    });
  });
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const { port } = server.address();
  return { server, requests, env: { UAR_BASE_URL: `http://127.0.0.1:${port}`, KB_ID: KB, UAR_TOKEN: TOKEN } };
}

async function evaluate(mode) {
  const s = await stub(mode);
  const lines = [];
  try {
    const code = await run(["--questions", QUESTIONS_FILE, "--retry-delay-ms", "0"], s.env, { log: (l) => lines.push(l) });
    return { code, text: lines.join("\n"), requests: s.requests };
  } finally {
    s.server.close();
  }
}

test("passes when each expected file is in the top 5 with its expected text", async () => {
  const { code, text, requests } = await evaluate("pass");
  assert.equal(code, 0, text);
  assert.match(text, /PASS \[critical\]: What version of IPFS Sync for Obsidian is available/);
  assert.match(text, /top-5: faq\.md, ipfs-sync-for-obsidian\.md, ipfs-sync-for-obsidian\.md/);
  assert.match(text, /PASS \[critical\]: What platforms does The Boss support\?/);
  assert.match(text, /recall@5: 2\/2 = 1\.000/);
  const searches = requests.filter((r) => r.url.endsWith("/search")).map((r) => JSON.parse(r.body));
  assert.deepEqual(searches[0], {
    query: "What version of IPFS Sync for Obsidian is available, and what version of Obsidian does it need?",
    limit: 5,
    min_score: 0.3,
  });
  assert.ok(!text.includes(TOKEN), "the token is never printed");
});

test("fails when the expected file is not in the top 5", async () => {
  const { code, text } = await evaluate("fail");
  assert.equal(code, 1, text);
  assert.match(text, /FAIL \[critical\]: What platforms does The Boss support\?/);
  assert.match(text, /top-5: faq\.md, faq\.md, faq\.md, faq\.md, faq\.md/);
  assert.match(text, /recall@5: 0\/2 = 0\.000/);

  const sixth = await evaluate("sixth");
  assert.equal(sixth.code, 1, sixth.text);
  assert.match(sixth.text, /FAIL \[critical\]: What platforms does The Boss support\?/);
});

test("resolves the knowledge base by name and --verbose prints each returned chunk", async () => {
  const s = await stub("pass");
  const lines = [];
  try {
    const env = { UAR_BASE_URL: s.env.UAR_BASE_URL, UAR_TOKEN: s.env.UAR_TOKEN, KB_NAME: "knowme-site" };
    const code = await run(["--questions", QUESTIONS_FILE, "--retry-delay-ms", "0", "--verbose"], env, {
      log: (l) => lines.push(l),
    });
    const text = lines.join("\n");
    assert.equal(code, 0, text);
    assert.match(text, /#1 faq\.md \(0\.40\): Questions people ask\./);
    assert.match(text, /#2 ipfs-sync-for-obsidian\.md \(0\.60\): IPFS Sync for Obsidian is at v0\.2\.0\./);
    assert.ok(s.requests.some((r) => r.url === "/api/uar/knowledge-bases"), "the knowledge bases were listed");
    assert.ok(!text.includes(TOKEN), "the token is never printed");
  } finally {
    s.server.close();
  }
  const missing = await run(["--questions", QUESTIONS_FILE], { UAR_BASE_URL: "http://127.0.0.1:1", UAR_TOKEN: TOKEN }, { log() {} }).catch((e) => e);
  assert.match(String(missing.message), /KB_ID \(or KB_NAME\)/);
});
