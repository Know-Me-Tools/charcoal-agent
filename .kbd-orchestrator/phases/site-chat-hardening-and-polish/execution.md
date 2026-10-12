# Execution: site-chat-hardening-and-polish

Dispatched 2026-10-12. Backend: **openspec**, driven change by change through `kbd-apply` (one task per turn; `begin-task` and `end-task` by the main thread only). Plan: `plan.md` revision 3. Task model assignments: `plan.md`, section "TASK MODEL ASSIGNMENTS", keyed by phase path `site-chat-hardening-and-polish`, change id and task id. The harness is Claude Code; routes are native `Agent` calls. Route availability was rechecked at dispatch only to the extent noted in "Route status" below.

## Recalled lessons the dispatched work must respect

From `agui-rendering-functionality/reflection.md` and this phase's `prior-context.md`:

- A visual or security assertion is not evidence until a mutation check shows it fails on the bug.
- Look at the captures even when every assertion passes.
- Run the real model against the real stack as soon as one path renders (4.4, 5.5 are local first, production again in change 15).
- Record a decision when a PR reverses one (`decision-log.md`).
- Keep the KBD ledger current as work lands; do not bulk-close at the end (hook memory writes time out, `pk exited 124`, so per-task closes can be slow).
- `tier-guard.sh` matches command text, including heredocs and polling loops: write files with the Write tool and keep banned phrases out of command text; open the tier-3 gate with `touch .kbd-orchestrator/tier3.allow` in its own call and delete it afterwards.
- Server tests need `KNOWME_WEB_DIST_DIR=tests/fixtures/web`.

## Standing constraints (verbatim from the operator, abridged)

- Never touch the kill switch or the repository variable `SITE_CHAT_KILL_SWITCH_EXPECTED`; chat stays on.
- No deploy unless a change must reach the cluster; interim PRs carry `[skip ci]`. The operator merges all PRs and approves every production deploy and every content or agent dispatch.
- No CopilotKit; official A2UI pinned exactly. Use only the `know-me` kube context.
- This repository is **public**: committing is publishing. No secrets, client names, patient data, credentials, private paths, pricing or internal analyses in tracked files. Private evidence lives in `.prometheus/knowledge-evidence/` (gitignored).
- Do not read `.env` files or credential values into the conversation; do not work around classifier denials.

## Round 1 dispatch (parallel, no mutual dependencies)

| Change | First task | Producer (plan table) |
|---|---|---|
| site-kb-content-pipeline | 2.1 | km-devops-engineer (sonnet) |
| site-impeccable-design-context | 1.1 | km-creative-director (opus) |
| site-reply-content-hardening | 3.1 | km-frontend-engineer (sonnet) |
| site-stream-step-visibility | 4.1 | km-qa-engineer (sonnet) |
| site-bundle-attribution | 8.1 | performance-optimizer (sonnet) |

Order inside the main thread: 2.1 first (its first commit carries the `.gitignore` entry that protects private evidence and must land before task 9.1), then 1.1, then the others as agents return.

## Branches and PRs

Plan and records go in one PR (`chore/site-hardening-plan`, `[skip ci]`). Each change then gets its own branch off `main` and its own PR titled `[skip ci] <change>: ...`. The operator merges.

## Route status (honest)

- Native `Agent` types and the `model` override were observed in the harness listing; none has been launched for this phase yet.
- `artifact-critic` accepting a model override is unverified; if a "critic-X" run cannot honour the model, the reviewer is recorded as the actual model used and independence is re-checked against the producer.
- The cross-model judge gateway (liter-llm, MiniMax-M3 for judge and critic since 2026-10-12) answers a chat call; a real judge dispatch has not been run, and M3's reasoning preamble may need stripping.
- Subagent access to firecrawl is unverified; task 12.2 runs on the main thread.

## Operator gates in this phase

BossFang `git pull` (10.1); company name (13.3, 14.4); prior-auth consent (11.0); comparative-claims review decision (14.4); each content or agent dispatch (13.3, 14.4, 5.1); scripted-preview choice after the CSP proof (3.5); Train C deploy; the live model runs need the operator's own credentials (4.4, 5.5, 15.1).
