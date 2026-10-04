# UAR roadmap items — drafts

Status: **drafts only.** Filing them in Prometheus-AGS/universal-agent-runtime waits on operator decision D-12 ("Approve filing the upstream UAR changes"). Evidence is from UAR `origin/main` at `e73b5f67` (2026-10-02) and from `research/landscape.md`.

Each item states what it gives every UAR user, what it could break for other uses, and what the KnowMe site needs from it. None is a Phase 0 dependency: the site's Phase 0 plan works around each one.

---

## 1. Session delete and persisted-session TTL

**Problem.** UAR has no way to delete a session or expire it.
- `/api/sessions` and `/api/sessions/{*path}` route to `legacy_sessions_route_disabled` (`src/server.rs:1631-1632`).
- The persistence trait has only save and load for sessions.
- The retention sweeper covers only the in-memory map and is off by default.
- Session data also lands in checkpoints, the cost ledger and tool admission evidence.

**Proposal.**
- An authenticated `DELETE /api/sessions/{id}` that cascades across sessions, checkpoints, the cost ledger, tool admission evidence and (when enabled) memory, for the caller's own sessions.
- An optional persisted TTL per agent or deployment, default *none*.

**General benefit.** Erasure (GDPR Art. 17, CCPA deletion) and retention limits for any deployment holding personal data. Every platform surveyed ships this:
- ADK requires an expiry on every session [L14].
- LangGraph has a TTL [L11].
- AgentCore has lifetimes [L2][L8].
- The Agents SDK has `clear_session` [L18].

**Risk to other uses.** Deleting checkpoints breaks resume and audit for A2A tasks and durable agent instances. The cascade must respect any legal-hold or audit retention, and the TTL default must stay "none" so existing deployments are unchanged.

**Site need.** FR-20 and FR-33, U2. Until this exists, Phase 0 uses an operator-scheduled purge (`site-session-erasure`).

---

## 2. Tool policy over built-in `ModelOnly` tools

**Problem.** Tool selection exempts built-in model-control tools (`turn/contributors.rs:209-210`). `activate_skill` is offered on every run, even when the agent's allowlist is empty. `tool_approval: deny` is the only lock.

**Proposal.** When an agent restricts tools (`tools.mode` `selected` or `none`) or skills (`skills.mode: none`), the built-ins those modes cover follow the restriction: drop `activate_skill` when skills are `none`. The current exemption stays when policy is unset.

**General benefit.** Least privilege that holds for every tenant restricting tools. The landscape found no surveyed platform that exempts meta-tools from policy [L6][L16][L17]; that is an inference from absence.

**Risk to other uses.** Agents that rely on implicit built-ins with policy unset. The change applies only when a restriction is explicit.

**Site need.** U1. Phase 2 widgets need `tool_approval: auto`, which is unsafe while `activate_skill` is always offered.

---

## 3. A better default chunker

**Problem.** The default `ChunkingStrategy::Recursive { size: 512 }` (`src/uar/domain/knowledge.rs:65,275`) splits at periods, including inside version numbers ("v0.", "Obsidian 1."). The 32–50-character fragments that result score highest and push out real content.

**Proposal.** A structure-aware recursive default: split on headings and paragraphs first, use a version-safe sentence splitter, set a minimum chunk size, and target 200–400 tokens [L57][L58].

**General benefit.** Better retrieval for every KB tenant that keeps the default.

**Risk to other uses.** It changes retrieval results for existing KBs. Apply it to new KBs only, or version the strategy so existing KBs keep theirs.

**Site need.** None for Phase 0. The site uses `chunk_strategy: "document"` (D-22).

---

## 4. Input screening on every entry point

**Problem.** The input guardrail (`src/uar/guardrails.rs`) runs only in `api_chat_completion` (`src/server.rs:5375-5402`). `/v1/messages`, `POST /api/uar/runs` and A2A are unscreened. The screen is a substring list (`guardrails.rs:41-57`) that includes common phrasings ("you are now", "act as if"), so blocking mode has a high false-positive risk.

**Proposal.**
- Apply the same screen, with the same config, on every model-input entry point.
- Add a pluggable screen interface, so a classifier-based screen can replace or supplement the substring list.

**General benefit.** Consistent protection for public and multi-tenant deployments.

**Risk to other uses.** New false positives on routes that were never screened. Keep detect-only as the default.

**Site need.** F5. The site stays detect-only for Phase 0. `site-redteam-prompts` measures the false-positive rate.

---

## 5. Usage on cancelled runs and on non-streaming responses

**Problem.**
- Streaming runs report usage on `agui.done` (`src/uar/api/sse.rs:690-709`). It is unverified whether a run cancelled by a client disconnect reports anything.
- The non-streaming chat-completion response returns `usage: None` (`src/server.rs:6585`), although the run's usage is known internally.

**Proposal.**
- Fill `usage` in the non-streaming OpenAI-compatible response.
- Record and expose usage for cancelled runs, through the cost ledger or a final event where one can still be delivered.

**General benefit.** Billing and metering accuracy for every client, including OpenAI-compatible callers.

**Risk to other uses.** None known. `usage` is a standard OpenAI field.

**Site need.** The site's spend meter (`site-spend-ceiling`) works around both gaps. It pins streaming and keeps a full reservation for any run that does not report. That overcounts, so the fix would let the meter settle accurately.

---

## 6. Dependabot rule for deliberately pinned crates

**Problem.** Three Dependabot merges left `main` unresolvable and broke the image build (run 36881586257; fixed by #324):
- `rmcp`: an exact pin bumped in one workspace member only.
- `wasmtime-wasi` and `fastembed`: bumped in the lockfile only, outside the manifest ranges.

**Proposal.** Add `ignore` entries, or a group that moves manifest and lock together, in `.github/dependabot.yml` for `rmcp`, `wasmtime`/`wasmtime-wasi` and `fastembed`.

**General benefit.** `main` stays buildable.

**Risk to other uses.** Security bumps for those crates need a manual PR.

**Site need.** None directly. It keeps the UAR image the site deploys from going stale.

---

## Filed 2026-10-03 (D-12)

1. Session delete and TTL: Prometheus-AGS/universal-agent-runtime#325
2. Tool policy over built-in tools: #326
3. Default chunker: #327
4. Input screening on every entry point: #328
5. Usage on cancelled and non-streaming runs: #329
6. Dependabot rule: #330
