# Assessment — uar-integration › uar-capability-assessment

Date: 2026-10-02. Stage: assess (revision 3, after adversarial review rounds 1 and 2; round 2 was the last allowed). The deliverable of this child is an adjusted plan, not code; the one permitted code change is the UAR build fix (goal 1).

## Evidence base

| Source | What it is | Weight |
|---|---|---|
| UAR code at `origin/main` | Audited at `6e0479eb`, then re-anchored at `e73b5f67` (after #324 merged). #324 touched only `Cargo.toml`/`Cargo.lock`, so source line numbers below are unchanged. Rows with a file:line were read; rows marked *no anchor* rest on the audit or on absence of a match. | Primary |
| `research/landscape.md` | 74 cited sources [L1]–[L74], ~55 primary, accessed 2026-10-02. | Primary for the external norm |
| Deep-research package `runtime-capabilities-a-production-public-20261002-0325` | **Unusable.** Stalled at stage 01 with 0 sources after ~22 min; the daemon hard-caps `max_sources: 10`. **Deviation from goal 4, pending operator acceptance (open question 6):** the external research was done by direct Firecrawl retrieval instead, and nothing below rests on the package. | None |
| `docs/agent-led-site/` §8–§10 | The strategy, the FRs, the paper's own Phase 0 plan (§9: 24 new changes plus edits to existing ones) and U1–U19. Its UAR audit predates `e73b5f67` by 16+ commits. | Requirements |
| Parent `plan.md` (12 changes) and canonical `progress.json` | Current KBD plan and state. | Position |
| `review/findings.json` | Adversarial review round 1: BLOCK, 2 critical, 6 warnings, 2 suggestions. Same model family as the producer (no distinct judge model configured; `cross_model_check: same-model-collision`). | Review |

Hand verification on `e73b5f67`:
- Budget scopes: `check_limits` applies token limits only at `BudgetScope::Run` (`max_tokens_per_turn`) and `BudgetScope::Session` (`max_tokens_per_session`) (`src/uar/runtime/cost_budget.rs:280-316`). Outside tests, `set_limit` is called only for the global limit (`src/uar/runtime/manager.rs:1553`). Per-run budgets are built from the agent artifact at `manager.rs:4550-4567`.
- Guardrail blocking is opt-in: `block_on_injection: false` default (`src/config.rs:2736,2754`).
- KB chunking is configurable per KB at creation: `KbConfigRequest { chunk_strategy, chunk_size, … }` (`src/uar/api/knowledge.rs:61-68`).
- JWKS ES256/ES384: `src/uar/security/verifier/mod.rs:167,187`; `jwks_url` config at `src/config.rs:631`.
- Site corpus: 8 files, 2,627 words, ≈3.5k tokens (`content/knowledge/*.md`).

## Goal 1 — UAR image build: fix merged, build in progress

- **Symptom:** `Build and Publish Images` on `main` failed (run 36881586257, 2026-10-01). Both legs stopped on `failed to select a version for rmcp` (amd64 15:13:55, arm64 15:15:43). The arm64 leg's `blob sha256:… not found` lines are BuildKit cache-import misses logged before the fatal error, not a second root cause.
- **Root cause:** three Dependabot merges left `main` unresolvable.
  - `5b41a7f5` pinned `rmcp =3.4.1` in `tools/mcp-server-fetch` while the root crate pinned `=3.1.2`.
  - #282 moved `wasmtime-wasi` to 48.0.1 in `Cargo.lock` only, outside the manifest's `"47"`.
  - #281 moved `fastembed` to 6.0.1 in `Cargo.lock` only, outside the pinned 5.x line.
- **Fix:** Prometheus-AGS/universal-agent-runtime#324, merged 2026-10-02 10:51 as `e73b5f67`. Root `rmcp` → `=3.4.1`; lock re-resolved inside manifest ranges.
- **Verified:** `cargo check --features server-full,postgres-backend --bin universal-agent-runtime -p universal-agent-runtime -p mcp-server-fetch` (nightly-2026-07-18) exits 0. **Not yet verified:** the post-merge image build (run 36997759532, both legs in progress at writing). Goal 1 closes when that run is green.
- **Recurrence risk:** Dependabot will repeat this for deliberately pinned crates; a `dependabot.yml` ignore/group rule is a follow-up recorded in the PR.

## Capability matrix

Status is UAR `e73b5f67`. "General" means the capability matters to UAR's other uses: the BossFang sidecar, desktop/mobile, A2A orchestration, MCP hosting, multi-tenant SaaS, and the Postgres and headless profiles (read from UAR's README, `docs/product-support-matrix.md`, `openspec/specs/`).

| # | Capability | UAR today | Site need | External norm | Owner | Scope |
|---|---|---|---|---|---|---|
| 1 | Session delete / TTL / erasure across sessions, checkpoints, cost ledger, admission evidence | **Absent.** `/api/sessions*` → `legacy_sessions_route_disabled` (`src/server.rs:1631-1632`); persistence trait has no delete (*audit anchor*); retention sweeper in-memory only, off by default. | FR-20, FR-33 (U2). Phase 0 uses an operator purge (`site-session-erasure`). | Every surveyed platform: ADK requires expiry [L14]; LangGraph TTL [L11]; AgentCore lifetimes [L2][L8]; Agents SDK `clear_session` [L18]. | UAR | General |
| 2 | Per-visitor identity | **Absent.** One shared `knowme-site` principal; ownership filters by JWT `sub` (*no anchor; openspec `multi-tenant-isolation`*). | Per-visitor budgets and erasure keys (U7). | Every surveyed platform scopes sessions/memory to a distinct user [L1][L8][L13][L14][L27]; pairwise `sub` advised [L4]. | flint-gate issues; UAR consumes | Issuance: site/gate. Consumption: general |
| 3 | Token / spend ceilings | **Partial, per run and per session only.** Limits from `extensions.budgets` apply at Run and Session scope (`cost_budget.rs:280-316`); the only aggregate is an in-process **global** limit (`manager.rs:1553`), reset on restart, not shared across replicas. **No per-agent or per-principal aggregate.** The session id is client-chosen (`src/server.rs:4738`), so a client that opens new threads gets a fresh session budget each time. | FR-36 (U6, U18). | Aggregate budgets across replicas (LiteLLM + Redis); Envoy Agent Router debits token buckets from response usage with ext_authz-supplied limits [L65][L66]. | **flint-gate** for the cross-visitor ceiling (paper's `site-spend-ceiling`). Today's working aggregate is UAR's `llm.budget.global_limit`: in-process, but UAR runs `replicas: 1` (`k8s/base/uar-deployment.yaml:15`), so it is a real cap for this deployment, reset on restart. **Any finite USD limit requires a catalog price for the model** or admission fails with "Model has no catalog price" (`cost_budget.rs:336-345`); `openai/qwen3.8-max` behind a custom base URL is unpriced until checked. Token limits (`max_tokens_per_*`) have no such dependency. | General |
| 4 | Usage reporting per run | **Present on the stream:** `agui.done` carries `usage {input_tokens, output_tokens, total_tokens}` (`src/uar/api/sse.rs:690-709`). Gap: usage for runs cancelled by a disconnect; AG-UI 1.0 field mapping unverified. | FR-38; any meter the site server keeps. | AG-UI 1.0 carries token usage [L40][L41]; OTel `gen_ai.usage.*`. | Site server can meter today; UAR for cancelled-run usage | General |
| 5 | Tool policy covering built-in tools | **Gap U1 confirmed.** `activate_skill` always offered and exempt from selection; `tool_approval: deny` is the only lock (*audit anchor: `turn/contributors.rs:209-222`*). | Phase 2 widgets need `auto`. | The landscape found no surveyed platform that exempts meta-tools [L6][L16][L17] — an inference from absence, not a documented statement. | UAR | General |
| 6 | Input guardrails (injection, PII) | **Present, absent from the site design.** `src/uar/guardrails.rs`; detect-only by default; blocking opt-in (`config.rs:2736,2754`); runs before the LLM call (`server.rs:5375-5402`). | Public untrusted input. | Input/output hooks standard [L16][L17]; probabilistic, so tool-less design matters more [C15]. | Site config, **with a cost**: the screen is a substring list that includes "you are now" and "act as if" (`src/uar/guardrails.rs:41-57`), so blocking will refuse ordinary visitor phrasing; the 400 `guardrail_blocked` is handled by neither the site server nor the client. Also: only `api_chat_completion` screens input (`server.rs:5375`); `/v1/messages`, `POST /api/uar/runs` and A2A do not — a general UAR gap. | General |
| 7 | Output moderation | **Absent** (*no anchor; grep found none*). | Brand safety. | Output guardrails standard. | UAR hook; site policy | General |
| 8 | KB retrieval embedding backend | **Done** (UAR #316): `VectorMatcher` uses `llm.embedding`; mismatch → `409 embedding_space_mismatch` (`src/uar/api/knowledge.rs:605-663`). | — | — | — | General |
| 9 | Chunking quality (U3) | **Default bug confirmed** (`Recursive { size: 512 }`, `src/uar/domain/knowledge.rs:65,275`), **but configurable per KB** (`chunk_strategy`, `chunk_size`, `knowledge.rs:61-68`), including a document-level strategy. | Grounded answers. | Structure-aware recursive at 200–400 tokens [L57][L58]; under ~200k tokens, full context is a viable alternative [L56] at higher per-turn input cost unless provider caching applies. | **Site config first** (KB created with `chunk_strategy: document` or a larger `chunk_size`); UAR default fix for everyone else | Default fix: general |
| 10 | Per-identity rate limiting | Absent in UAR (one unkeyed governor, `src/uar/security/rate_limit.rs`, *audit anchor*). | Abuse control. | Edge concern; per-IP fails against inference theft [L30] (vendor claim). | Site server + gate + edge bot verification | Site |
| 11 | Durable API keys | **Absent.** `InMemoryApiKeyStorage` only (*audit anchor*). | Moot for the site once gate JWTs land. | — | UAR | General (BossFang, key-auth tenants) |
| 12 | JWKS ES256/ES384 | **Present** (#321; `src/uar/security/verifier/mod.rs:167,187`; `config.rs:631`). | FR-46. | — | Done | General |
| 13 | AG-UI / A2UI | Present (dual dialects, A2UI v0.9.1, three renderers; *audit anchor*). | Client fixes; missing link/citation catalog component. | AG-UI 1.0 (2026-09-30) adds metadata + usage [L40]. | UAR (catalog component, AG-UI 1.0) | General |
| 14 | Run evidence on the public path | `effective_run_policy`, `turn_manifest` stream on every run (*audit anchor*). | Filter (FR-45). | — | Site server | Site |
| 15 | Observability (OTel GenAI, `session.id` on spans) | **Unverified**; grep found no `gen_ai.*` attributes. | Evals, cost attribution, erasure scoping. | Production evals on OTel GenAI traces keyed by `session.id` [L9][L10][L21]; semconv still Development [L38][L39]. | UAR | General |
| 16 | Conversation memory | Present, opt-in; per-request flag defaults on (*audit anchor*). | Off for a shared principal (FR-41). | Off or TTL'd for anonymous users [L14]. | Site server | Site |
| 17 | KB ingestion provenance | Operator-only write path. | Poisoning resistance. | PoisonedRAG 90–97% success with 5 texts [C16]. | Ops | General |
| 18 | AI disclosure | n/a | Art. 50(1) applies since 2026-08-02 [L48]. | Static label. | Site (`site-ai-disclosure-label`) | Site |

## Unresolved findings U1–U19: status after this assessment

| # | Status | Where it lands |
|---|---|---|
| U1 `activate_skill` exemption | Confirmed open | UAR roadmap; Phase 0 stays at `deny` |
| U2 no session delete/TTL | Confirmed open; a general gap by the external norm | UAR roadmap; Phase 0 `site-session-erasure` |
| U3 chunker splits version numbers | Default confirmed; **config workaround exists** (matrix row 9) | `kb-chunking-quality` becomes a config decision first |
| U4 no gate ext_authz | Open | `gate-ext-authz-endpoint` |
| U5 gate key scoping across routes | Not re-checked here | `gate-site-credentials` (already assigned) |
| U6 no Redis in flint-core | Open; UAR's aggregate is also in-process only | D-4 |
| U7 no per-visitor identity | Confirmed | Phase 2 spike |
| U8 `activate_skill` traced from source only | Still unverified at runtime | `site-agent-tool-allowlist` FR-11 test |
| U9 live ES256 path untested end to end | UAR side merged; gate JWKS deployed | `gate-site-credentials` test |
| U10 client IP behind Envoy | Unverified | First deploy |
| U11 exposure window before controls | Open | Ordering rule: seed only after Phase 0 controls |
| U12 **Qwen Token Plan terms may forbid application backends** | Open; **can invalidate the model the whole stack runs on** | D-2 — operator, before any public traffic |
| U13 legal readings | Art. 50(1) applies since 2026-08-02 per a law-firm summary of the Commission guidelines [L48], not the guidelines themselves; EUR-Lex still not read directly | D-17 |
| U14 ePrivacy / experiment bucket | Open | D-10 |
| U15 sso-broker policy | Open | D-19 |
| U16 flint-infra `deploy.yaml` split-brain | Open | D-20 |
| U17 D-3/D-4/D-18 overlap | Open | Operator |
| U18 spend ceiling can't see usage | Open, but its premise changed: UAR already emits per-run usage on `agui.done` (row 4). Under ext_authz gate does not see the stream, and the Envoy AI Gateway pattern [L65][L66] meters OpenAI-schema responses, not AG-UI SSE, so it does not apply as is. The three options §10 lists remain: (a) a usage feed from the site server (which sees `agui.done`) to gate's budget; (b) UAR's own budgets — per-session token limits plus the single-replica `global_limit`; (c) a per-turn counter in the site server. (a) and (c) need no UAR change. | `site-spend-ceiling`, D-4 |
| U19 Argo revision annotation | Open; observed again on 2026-10-02 | know-me-cluster fix |

## Findings that change the plan

- **F1. Canonical state is behind reality.** Two parent changes are PENDING although their work has merged:
  - `uar-kb-retrieval-embedding` (UAR #316)
  - `memory-server-ghcr-publish` (SMS #29)

  The paper also records two of its own changes as done or nearly done:
  - `uar-jwks-es256`: #321 merged, plus the build fix #324.
  - `gate-ec-jwks-deploy`: the JWKS fix was deployed 2026-10-01.

  The plan must reconcile these through KBD, running each change's "done when" check.
- **F2. The paper already contains the adjusted plan; the KBD plan never absorbed it.** `agent-led-site.md` §9 defines 24 new Phase 0 changes, edits to 8 existing changes, and moves `apex-dns-cutover` to the end of Phase 1. The KBD plan has 12 changes and still ends with the cutover. That makes the cutover a Phase 0 change, contradicting the paper.

  The 24 new changes:
  - `ci-secrets-out`, `uar-runtime-host-lockdown`, `uar-jwks-es256`, `gate-ec-jwks-deploy`
  - `gate-ext-authz-endpoint`, `gate-site-credentials`, `cluster-extauthz-policies`, `gate-ci-gitops`
  - `kb-chunking-quality`
  - `site-agent-tool-allowlist`, `site-proxy-artifact-filter`, `site-session-erasure`, `site-session-binding`, `site-proxy-hardening`
  - `site-spend-ceiling`, `site-security-headers`, `ci-supply-chain-pins`, `site-ai-disclosure-label`
  - `site-retention-and-privacy`, `site-citation-link-allowlist`, `site-chat-offline-states`
  - `site-agent-prompt-fixes`, `site-agent-eval-text`, `site-redteam-prompts`

  The edits to existing changes:
  - `k8s-stack-manifests` must not contain the `runtime.know-me.tools` route. That conflicts with the current manifests and depends on `uar-runtime-host-lockdown`.
  - `github-deploy-workflows` gains a task to fix the chat smoke test, which can never pass: it greps for a `type` field that the dual dialect doesn't emit.
  - `site-agent-seed` is gated after `kb-chunking-quality` and gains a KB health check.

  The work of the plan stage is to adopt §9 into KBD, amended by F3–F7 below, rather than invent a new list.
- **F3. Amend `site-spend-ceiling`: the usage signal exists, so the ceiling can be built without a UAR change, with two traps.**
  - Every run already reports its tokens on `agui.done` (`sse.rs:690-709`), and the site server sees every turn. It can keep the cross-visitor meter itself (option c), or feed it to gate's `max_token_budget` (option a). The Envoy-metering design in the first revision of this finding does not fit the documented topology. Under ext_authz, gate never sees the stream, and that design meters OpenAI-schema responses, not AG-UI.
  - UAR adds two layers on top:
    - per-session token limits in `extensions.budgets`, which bound one conversation;
    - `llm.budget.global_limit`, a real process-wide cap while UAR runs one replica.
  - Trap 1: **USD limits need a catalog price.** Admission fails for an unpriced model (`cost_budget.rs:336-345`). Check `openai/qwen3.8-max` pricing before setting any `*_usd` limit, and prefer token limits until it is confirmed.
  - Trap 2: **disconnect-cancelled runs.** Whether usage is reported for them is unverified. A meter built on `agui.done` undercounts them.
- **F4. Amend `kb-chunking-quality`: try configuration before code.** KBs accept `chunk_strategy` and `chunk_size` at creation (`knowledge.rs:61-68`). Re-seeding the site KB with document-level chunks, or with a larger chunk size, may clear U3 for the site without a UAR change. The corpus is about 3.5k tokens, so whole-document chunks are small.
  - Full-context grounding is a further option. It suits a corpus this size [L56], but costs more input tokens per turn unless provider caching applies. It also no longer shows off KnowMe's retrieval, which works against the strategy (operator decision).
  - The UAR default chunker fix stays on the UAR roadmap for every other KB tenant.
- **F5. Injection blocking: a decision, not a free flag.** `block_on_injection: true` blocks before the LLM call. The screen matches substrings, including "you are now" and "act as if" (`guardrails.rs:41-57`). It will refuse ordinary visitor phrasing, and the resulting 400 is handled by neither the site server nor the client.
  - Turning it on needs three things first:
    - proxy mapping of `guardrail_blocked` to a visitor-facing message;
    - the guardrail failure state the paper puts in Phase 1;
    - a check of the phrase list against the red-team and golden sets.
  - Until then, detect-only logging is the Phase 0 setting.
  - Separately, a general UAR gap: input screening runs only on `api_chat_completion`. `/v1/messages`, `POST /api/uar/runs` and A2A are unscreened.
- **F6. Add bot verification on the chat route to Phase 1.** Per-IP limits do not stop distributed inference theft [L30] (vendor claim). This is an edge or site-server change, not UAR.
- **F7. Session delete/TTL (U2) belongs on the UAR roadmap regardless of the site.** It is the one capability every surveyed platform ships. It matters to any UAR deployment that holds personal data subject to erasure rights, such as GDPR or CCPA. It does not matter to every deployment: a single-user desktop install is unaffected.
- **F8. The paper's §3.3 conversion figure is stale.** "AI-referred visitors converted 9% less" was Feb 2025 data. Adobe reports AI-referred visitors outperforming for 11 straight months to July 2026 [L69]–[L71]. That is retail panel data about visitors arriving from AI assistants, not about on-site agents. This is a doc correction, not a plan change.

## Ranked blockers for Phase 0 exit and Phase 1 launch

1. **U12 / D-2: Token Plan terms.** If application backends are forbidden, the model must change before anything public. Operator.
2. **Gate auth chain:** `gate-ext-authz-endpoint` → `gate-site-credentials` → `cluster-extauthz-policies` (U4, U9).
3. **Before the first deploy:** `uar-runtime-host-lockdown` and `ci-secrets-out` (T6, T14).
4. **`site-session-binding`** (FR-34).
5. **`site-spend-ceiling`**: site-server meter from `agui.done` usage, optionally fed to gate, with UAR per-session token limits and `global_limit` beneath it (F3). Check model pricing before any USD limit.
6. **Grounding:** `kb-chunking-quality`, config first (F4), then `site-agent-seed` and `site-agent-eval-text`.
7. **`site-session-erasure`** (U2 workaround).
8. Proxy hardening and artifact filter (FR-42, FR-45).
9. Red-team set; injection blocking only after its 400 is handled (F5).
10. Bot verification (F6, Phase 1).

## UAR roadmap candidates (for the plan stage; risk to other uses included per goal 3)

| Candidate | Benefits | Risk to other uses | Site need |
|---|---|---|---|
| Session delete + persisted TTL, cascading to all four stores | Any deployment holding personal data | Deleting checkpoints breaks resume and audit for A2A tasks and durable agent instances; needs an opt-in TTL default of "none" and a cascade that respects legal holds | U2 |
| Subject built-in `ModelOnly` tools to tool policy (the exemption at `turn/contributors.rs:209-210` covers all of them, `activate_skill` included) | Every tenant restricting tools | Agents relying on implicit built-ins with policy unset; change behaviour only when tools or skills are explicitly restricted | U1, Phase 2 |
| Better default chunker (structure-aware, minimum chunk size) | Every KB tenant | Changes retrieval results for existing KBs; apply to new KBs only, or version the strategy | U3 (site has a config workaround) |
| Usage on the AG-UI stream (1.0) and OTel GenAI spans with `session.id` | Every client, evals, billing | Stream shape change for existing renderers; gate behind dialect negotiation. Content capture must stay opt-in (PII) | U18, FR-38 |
| Aggregate budget scope (per agent / per principal) with a shared store | Horizontally scaled and multi-tenant deployments | **UAR shipped a per-agent cost limit (`ch06-wire-agent-cost-budget`, `e68e2fb4`) and removed it on purpose in `d6f4f862`**, keeping session ceilings per root session (`manager.rs:4550` comment). Reintroducing it must answer why it was removed. A shared store would also be a new enforcement dependency. Not proposed for this project; the site meter (F3) covers the need. | U6 |
| Input screening on every entry point (`/v1/messages`, runs API, A2A) and a non-substring screen | Every public or multi-tenant deployment | False positives on any new route; keep detect-only as the default | F5 |
| Usage on cancelled runs | Billing accuracy everywhere | None known | F3 trap 2 |
| Output guardrail hook | Every public agent | Adds latency to streaming; must be opt-in and streaming-aware | Brand safety |
| Durable API key store | BossFang, key-auth tenants | Persisting secrets adds a storage-security obligation; hash at rest | None once gate JWTs land |

Explicitly **not** UAR's job, because it would bend a general runtime to one site:
- per-IP limiting
- bot verification
- visitor-identity issuance
- artifact filtering on the public path
- the AI-disclosure UI

These stay in the site server, edge or gate. The earlier "full-context KB mode" candidate is dropped: per-KB `chunk_strategy` covers the site's need.

## Open questions for plan

1. D-2: Token Plan terms, or a capped pay-as-you-go key. (operator)
2. F2: adopt §9 into this phase as written, or split Phase 0 controls into a sibling phase? Either way, `apex-dns-cutover` leaves Phase 0. (operator)
3. F4: site grounding: document-level chunks, larger chunks, or full context. (operator; it touches the "use our own technology" strategy)
4. D-3/D-4: budget numbers and limiter, now with two layers (gate aggregate, UAR per session).
5. Which UAR roadmap candidates this project tracks, versus a phase in the UAR repo.
6. Accept the deep-research deviation (Firecrawl landscape instead of the stalled package), or re-run deep-research once the daemon's 10-source cap is lifted.
7. Injection blocking (F5): stay detect-only for Phase 0, or build the 400 handling and turn it on.

## Unverified

- The post-merge UAR image build (run 36997759532).
- Catalog pricing for `openai/qwen3.8-max` (decides whether USD limits can be used).
- Usage reporting for disconnect-cancelled runs.
- AG-UI 1.0 field mapping of `agui.done` usage, and `session.id` on spans.
- U5 (gate key scoping) was not re-checked.
- Matrix rows marked *audit anchor* rely on the code audit's citations, not on a second read.
- Landscape items marked unverified in `research/landscape.md`: ChatKit limits, AgentCore Policy GA date, AG-UI 1.0 field names, the Art. 50(2) deferral.
- Document-level chunking on this corpus has not been tested against the FR-8 checks.

## Adversarial review round 1: disposition

| Finding | Disposition |
|---|---|
| CRITICAL: spend ceiling claim false | Accepted. Matrix row 3, F3, blocker 5 and the roadmap rewritten; verified at `cost_budget.rs:280-316`, `manager.rs:1553`. |
| CRITICAL: F7 listed 9 of 24 changes | Accepted. F2 now lists all 24 and the existing-change edits. |
| WARNING: U findings missing | Accepted. U1–U19 table added. |
| WARNING: chunk config workaround missed | Accepted. Row 9, F4; full-context candidate dropped. |
| WARNING: arm64 separate failure | Partly rejected. The `blob not found` lines are cache-import misses; both legs failed on `rmcp`. The post-merge run is noted as unverified. |
| WARNING: no risk-to-other-uses analysis | Accepted. Roadmap column added; F7 scoped. |
| WARNING: F4 overstated [L56] | Accepted. Reworded; cost caveat added. |
| WARNING: anchors | Accepted. Method statement corrected, re-anchored at `e73b5f67`, JWKS anchor fixed, unanchored rows marked. |
| SUGGESTION: inference from absence | Accepted (row 5). |
| SUGGESTION: deep-research deviation | Accepted. Recorded as a deviation pending operator acceptance (open question 6). |

## The uncomfortable part

The site plan was already written, in this repository, by this project, and the KBD plan ignored it. The paper's §9 says the deployment is not public until 24 controls exist and puts the DNS cutover at the end of Phase 1. The KBD plan still ends Phase 0 with that cutover. The review also caught this assessment's first draft proposing to move the spend ceiling into UAR based on a misread of budget scopes. That would have shipped a public endpoint with no cross-visitor cap. Both errors had the same cause: trusting an earlier summary over the document or the code. The plan stage must work from §9 and the code, not from this assessment's summaries of them.

## Adversarial review round 2: disposition (final round; no round 3)

| Finding | Disposition |
|---|---|
| CRITICAL: spend-ceiling rewrite rests on false premises (Envoy metering vs ext_authz topology; usage already on `agui.done`) | Accepted. Verified `sse.rs:690-709`. Row 4, U18 row, F3 and blocker 5 rewritten around the existing usage signal and §10's three options. |
| CRITICAL (partial): `global_limit` backstop dropped | Accepted. Row 3 and F3 restore it, scoped to the single-replica deployment. |
| WARNING: USD limits fail on unpriced models | Accepted. Verified `cost_budget.rs:336-345`; F3 trap 1; unverified list. |
| WARNING: F5 "costs nothing" false; screening only on one route | Accepted. Verified `guardrails.rs:41-57`; F5 rewritten; roadmap row added. |
| WARNING: aggregate candidate ignores `d6f4f862` removal | Accepted. Roadmap row now records the removal and drops the proposal. |
| SUGGESTION: U1 exemption covers all `ModelOnly` tools | Accepted. Roadmap row widened. |
| SUGGESTION: [L48] attribution; F8 qualifier | Accepted. |
| SUGGESTION: deviation self-accepted | Accepted. Now open question 6. |

## Unresolved review findings

None open as findings. Round 2 was the last review round, so the revisions above **have not been re-reviewed**. The plan stage should treat F3 and F5, the two sections rewritten twice, as the least-verified parts of this assessment and check them against code before turning them into tasks.
