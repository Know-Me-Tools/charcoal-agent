# Plan — uar-integration › uar-capability-assessment

Date: 2026-10-02. Revision 3, after plan review rounds 1 and 2 (round 2 was the last). Input: `assessment.md` (revision 3) and the operator's answers of 2026-10-02.

This child produces no product code. It has two parts:
- **Part A**, the adjusted `uar-integration` plan: what the parent phase will execute.
- **Part B**, the changes this child executes to install Part A in KBD, OpenSpec and the docs.

## Operator decisions recorded (2026-10-02)

| # | Decision | Operator's words / rationale |
|---|---|---|
| D-2 | **Keep the Qwen Token Plan.** The operator classifies the site under the "operator model": the plan's owner is the client, and the Token Plan assists that owner. | "we are in the 'operator' model where the token plan is being used to assist the owner of the plan, who is the client." **Recorded as a risk accepted by the operator, not as closing U12.** Neither of §9's two exits (written approval from Alibaba, or a capped pay-as-you-go key) was taken. U12 stays open in §10 with this rationale and the [C13] reference. Kill criterion 1 and the provider-side spend alert keep their dependency on it. |
| D-21 | **Adopt `agent-led-site.md` §9 Phase 0 into `uar-integration`.** `uar-integration` becomes Phase 0 ("safe to deploy, not public"). `apex-dns-cutover` leaves this phase for Phase 1, as §9 says. | "Adopt in this phase." |
| D-22 | **Site grounding keeps retrieval, with document-level chunks.** The site KB is created with `chunk_strategy: "document"` (`KbConfigRequest`, UAR `src/uar/api/knowledge.rs:61-68`). The corpus is 8 files and about 3.5k tokens, so whole documents are small. Full-context grounding is not adopted, because the site should run KnowMe's own retrieval. The UAR default-chunker fix goes to the UAR roadmap. | "do as you recommend" (assessment F4). |
| D-23 | **Accept the Firecrawl landscape** (`research/landscape.md`, 74 sources) in place of the stalled deep-research package. | "Yes. accept." |

Still open, unchanged from §9: D-1, D-3–D-8, D-10, D-12, D-15–D-20.

## Part A — the adjusted `uar-integration` plan (Phase 0)

**Goal.** Phase 0 makes the stack safe to deploy, not public. `know-me.tools` stays on Lovable throughout. The exit criteria are §9's "Phase 0 exit criteria", with the amendments below.

### A1. Existing changes: reconcile, amend, or move

| Change | Canonical now | Action |
|---|---|---|
| `uar-ghcr-multiarch-publish` | DONE | None. |
| `uar-kb-retrieval-embedding` | PENDING | **Complete.** UAR #316 is merged. Remaining task 1.4: confirm that a published image contains it. That image is the first green `Build and Publish Images` run after #324 (run 36997759532 or later). |
| `memory-server-ghcr-publish` | PENDING | **Complete after 1.4.** SMS #29 is merged. Verify the multi-arch manifest and `/health` on the published image. |
| `cluster-gateway-and-cert` | DONE | None. |
| `site-knowledge-corpus` | DONE | None. |
| `local-compose-stack` | PENDING | 1.4: four-service gate (unchanged). |
| `site-agent-seed` | PENDING | **Amend:** add the FR-8 KB health check. Gate 1.3 runs after `kb-chunking-quality`, which owns the chunking change (N9). Site-key minting is removed by `gate-site-credentials`. |
| `site-chat-proxy` | IN_PROGRESS | **Amend the title:** "behind the nginx site proxy" → "behind the Axum site server". Remaining: 1.5 (Axum server), then 1.4 (integration gate and visual capture). |
| `about-endpoint-truth` | PENDING | 1.2 visual capture (unchanged). |
| `k8s-stack-manifests` | PENDING | **Amend:**<br>• Must not contain the `runtime.know-me.tools` HTTPRoute; depends on `uar-runtime-host-lockdown`.<br>• A NetworkPolicy allowing `knowme-web` pods to reach the SurrealDB pod on port 8000 (pods and ports only).<br>• A Secret reference for the meter credential (N15). The credential itself is created out of band by the operator, like the UAR Secret in `ci-secrets-out`.<br>`knowme-web` stays at `replicas: 2`, because `site-session-binding` tests with two replicas. |
| `github-deploy-workflows` | PENDING | **Amend:** add a task to fix the chat smoke test. It sends `stream_mode: dual` but greps `"type":"TEXT_MESSAGE_CONTENT"`, which dual mode doesn't emit; grep `agui.message.delta` instead. Also move the `runtime.know-me.tools` checks per FR-37. |
| `apex-dns-cutover` | PENDING | **Cancel in this phase, with reason:** "moved to Phase 1 per D-21". Its OpenSpec change stays in place for the Phase 1 KBD phase to pick up. |

### A2. New changes from §9 (rows are §9's table; amendments in **bold**)

Each row's full definition (FRs, owners, done-when) is §9's row of the same id; this table adds only state and amendments.

| # | Change | State | Amendment from this child |
|---|---|---|---|
| N1 | `ci-secrets-out` | new | — Lands before the first deploy. |
| N2 | `uar-runtime-host-lockdown` | new | — Lands before the first deploy. D-7 still open. |
| N3 | `uar-jwks-es256` | **effectively done** | #321 merged. The build fix #324 is merged too. Done when a digest-pinned UAR image carries it, through `ci-supply-chain-pins`. |
| N4 | `gate-ec-jwks-deploy` | **effectively done** | Deployed 2026-10-01: the gate JWKS serves `kty`, `crv`, `x`, `y`. Register it and complete it on that evidence. |
| N5 | `gate-ext-authz-endpoint` | new | — |
| N6 | `gate-site-credentials` | new | Also closes U5 (key scoping across routes), as §9 states. |
| N7 | `cluster-extauthz-policies` | new | — |
| N8 | `gate-ci-gitops` | **mostly done** | Done:<br>• flint-gate CI no longer deploys to `ssr` (flint-gate #11).<br>• Digest from the flint-infra artifact (#12).<br>• Pipeline proven end to end on 2026-10-02: Know-Me-Tools/flint-gate run 36988125837 opened Prometheus-AGS/know-me-cluster#3.<br>**Remaining:** D-20 (flint-infra `deploy.yaml`), and **a task to remove the hard-coded `deployment.kubernetes.io/revision` annotation in know-me-cluster** (U19). |
| N9 | `kb-chunking-quality` | new | **The decision-log entry is D-22: config, not a UAR code change.** This change has no dependency on `site-agent-seed`. It covers:<br>1. Change `scripts/seed-site-agent.sh` to send `config.chunk_strategy: "document"` when it creates the KB. The script sends `config` only on create and skips existing documents, so also add a `--recreate-kb` flag that deletes and recreates the site KB and re-ingests every document. The agent binds its KB by name, so recreating it is safe.<br>2. Recreate the local KB on the compose stack and run the FR-8 chunk checks there. If document chunks fail, try a larger `chunk_size` and record the result. **This local pass is the change's done-when.**<br>**The deployed FR-8 check belongs to `site-agent-seed` 1.6** (revised after the final review; 1.3 is the local gate), which runs after this change: one direction, no cycle. If the deployed check fails, `site-agent-seed` reopens this change. |
| N10 | `site-agent-tool-allowlist` | new | **Keep the guardrail at detect-only for Phase 0** (assessment F5). Add a task: confirm `UAR_GUARDRAILS__INPUT_SCREENING_ENABLED` stays on and that flagged inputs are logged. |
| N11 | `site-proxy-artifact-filter` | new | — |
| N12 | `site-session-erasure` | new | — |
| N13 | `site-session-binding` | new | — |
| N14 | `site-proxy-hardening` | new | **Add:**<br>• Map UAR's 400 `guardrail_blocked` to a generic visitor message, so that turning on blocking later is safe.<br>• **Pin the upstream request shape.** The server sets `stream: true` and `stream_mode: "dual"` itself. The visitor's `stream` and `stream_mode` fields are ignored (`server/src/domain/chat_request.rs:50-60` stops forwarding them). One dialect, `agui.done`, therefore carries the usage for every run. No server-side aggregation: the client's title path already collects a streamed response (`src/features/chat/use-thread-naming.ts`, streaming fallback), and its `stream: false` request is simply ignored. |
| N15 | `site-spend-ceiling` | new | **Amended mechanism (assessment F3; plan review rounds 1 and 2).** §9 sets the ceiling at flint-gate, but under ext_authz gate never sees run usage (U18). The **enforcing cross-visitor ceiling is a site-server meter that reserves before it forwards.** Feeding it to gate's `max_token_budget` is optional, and D-4 decides it.<br>• **Reserve, then settle.** Before forwarding a turn, the server atomically reserves the per-turn reservation size against the daily and monthly counters (superseded detail; see `openspec/changes/site-spend-ceiling/tasks.md`). It refuses the turn if the reservation would exceed the D-3 budget. When the run's `agui.done` arrives (`src/uar/api/sse.rs:690-709`), the reservation is settled to the actual `usage.total_tokens`. A run that never reports usage (disconnect, error, any unexpected path) keeps its full reservation. So **every run that reaches UAR is counted** whatever the request fields, and concurrent turns reserve before they run. A multi-call run can still exceed its reservation by up to one model call, because UAR checks the per-turn limit when each call is admitted. That excess is charged, alerted and recorded, so overshoot is bounded and measured, not zero.<br>• **One dialect.** N14 pins `stream: true`, `stream_mode: dual`. Settlement parses only `agui.done`; anything else stays at its reservation.<br>• **Store.** The daily and monthly counters live in SurrealDB in its own namespace and database (`ns=site`, `db=meter`), separate from UAR's `ns=uar` / `db=uar` (`k8s/base/surrealdb-statefulset.yaml`). Access is through a user defined `ON DATABASE` for `site/meter` only, with no rights in `ns=uar`. The operator creates that user out of band, with root, before the first deploy, so CI never holds root. A compromised site server then reaches the meter counter, not visitor transcripts. The NetworkPolicy limits which pods connect (`k8s-stack-manifests`). The daily and monthly counters (rows keyed by UTC period, created on first use) are reserved in one SurrealDB transaction with conditional updates (`WHERE total + n <= budget`).<br>• **Fail closed.** If the meter store is unreachable, new turns are refused with the offline state. A ceiling that fails open is not a ceiling.<br>• **Alerts (FR-36).** A warning alert fires at 80% of the daily budget and at exhaustion, through the same channel as the provider-side spend alert.<br>• **Monthly cap (D-3).** Until the model has a catalog price, the monthly cap is a monthly token budget enforced by the same meter, plus the provider-side spend alert. `max_cost_per_session_usd` and `llm.budget.global_limit` are USD and fail admission for an unpriced model (`cost_budget.rs:336-345`; `manager.rs:1553-1559`), so neither is set until pricing is checked.<br>• **Per-conversation bound, not a per-visitor layer.** UAR `max_tokens_per_session` limits one conversation's length. The visitor chooses the session through `thread_id`, so it caps nothing per visitor.<br>**Done-when:**<br>• (1) A `stream: false` request and a `stream_mode: agui_spec` request are each metered.<br>• (2) A run aborted by a client disconnect keeps its reservation.<br>• (3) **N concurrent turns at the budget boundary** are admitted only while their reservations fit, and any overshoot equals the recorded excess of runs that exceeded their reservation.<br>• (4) The total survives a `knowme-web` rollout, and two replicas share it.<br>• (5) With the meter path broken while UAR stays healthy (meter credential revoked, or only `knowme-web` → SurrealDB cut), turns are refused and UAR receives no chat call.<br>• (6) The 80% and exhaustion alerts fire.<br>The kill switch, `max_output_tokens` and FR-38 records stay as §9 lists them. |
| N16 | `site-security-headers` | new | — |
| N17 | `ci-supply-chain-pins` | new | — |
| N18 | `site-ai-disclosure-label` | new | — |
| N19 | `site-retention-and-privacy` | new | — |
| N20 | `site-citation-link-allowlist` | new | — |
| N21 | `site-chat-offline-states` | new | **Covers "meter unavailable". Its fail-closed check breaks the meter path while UAR stays up** (added by the OpenSpec authoring; adopted after the final review). |
| N22 | `site-agent-prompt-fixes` | new | — |
| N23 | `site-agent-eval-text` | new | — |
| N24 | `site-redteam-prompts` | new | **Add:** include benign visitor phrasings that hit the guardrail's substring list ("you are now…", "act as if…"). That measures the false-positive rate, which decides whether blocking can be turned on. |

### A3. Order (Phase 0)

Dependencies are §9's, plus the amendments above. Added edges: N14 → N15 (the meter needs forced streaming), and, after the final review, the N15 build → the first deploy (switch on) → N15 deployed done-when → switch off. The parent plan's revision 3 order is authoritative where the two differ.

1. **Close what is done now:**
   - `uar-kb-retrieval-embedding`, `memory-server-ghcr-publish`, `gate-ec-jwks-deploy`, each on its done-when check.
2. **Before the first deploy, in parallel:**
   - `uar-runtime-host-lockdown`, `ci-supply-chain-pins`, `gate-ext-authz-endpoint`
   - `site-chat-proxy` 1.5 → 1.4, `local-compose-stack`, `about-endpoint-truth`
   - `kb-chunking-quality` (local steps 1–2)
3. **Close `uar-jwks-es256`** once `ci-supply-chain-pins` pins a UAR digest that contains #321.
4. **Gate chain:**
   - `gate-ext-authz-endpoint` → `gate-site-credentials` (also needs `uar-jwks-es256`, `gate-ec-jwks-deploy` and **D-18**)
   - then `ci-secrets-out` and `cluster-extauthz-policies` in parallel (§9: the policies need only the endpoint and the credentials)
   - `gate-ci-gitops` remaining tasks run in parallel.
5. **Site controls once `site-chat-proxy` lands:**
   - `site-proxy-hardening`, `site-proxy-artifact-filter`, `site-session-binding`, `site-session-erasure`
   - `site-security-headers`, `site-citation-link-allowlist`, `site-ai-disclosure-label`
6. **Deploy path** (revised after the final review):
   - First, build `site-spend-ceiling` (tasks 1.1–1.9, 1.13; after `site-proxy-hardening`, `gate-site-credentials`, **D-3**, **D-4**) and pass its local done-when.
   - `k8s-stack-manifests` (after `uar-runtime-host-lockdown`).
   - `github-deploy-workflows` (after `ci-secrets-out` and the meter build). **The first deploy ships with the kill switch on**, so the stack spends no quota for a visitor who sends the Host header.
   - `site-agent-seed` (after `kb-chunking-quality` and `gate-site-credentials`; its deployed gate 1.6 runs after the first deploy).
7. **Run controls on the deployed stack:**
   - `site-spend-ceiling` 1.14 (deployed done-when) → operator turns the switch off → `site-chat-offline-states`
   - `site-agent-tool-allowlist` → `site-agent-prompt-fixes` → `site-agent-eval-text`
   - `site-retention-and-privacy`, `site-redteam-prompts`
8. **Phase 0 exit check** per §9, after every control it tests is deployed.

**Critical path:**
- `ci-supply-chain-pins` → `uar-jwks-es256`
- with `gate-ext-authz-endpoint` and **D-18** → `gate-site-credentials` → `ci-secrets-out` → `github-deploy-workflows` (first deploy)
- → `site-agent-seed` → `site-agent-tool-allowlist` → `site-agent-prompt-fixes` → `site-agent-eval-text` → exit.

**Operator decisions on or beside the path:** D-18 (gate credentials and budgets), D-3 and D-4 (spend numbers, store and limiter), D-5, D-6, D-8, D-16 (exit-criteria decisions). `gate-ext-authz-endpoint` is the only new platform code on the path (about 200 lines in flint-gate).

**Phase 0 totals:** 12 existing changes plus 24 new makes **36 registered**. Expected canonical states after B4:

| State | Count | Changes |
|---|---|---|
| DONE | 6 | `uar-ghcr-multiarch-publish`, `cluster-gateway-and-cert`, `site-knowledge-corpus`, `uar-kb-retrieval-embedding`, `memory-server-ghcr-publish`, `gate-ec-jwks-deploy` (the last three on their done-when checks) |
| IN_PROGRESS | 3 | `site-chat-proxy`, `uar-jwks-es256` (waits on the pinned digest), `gate-ci-gitops` (D-20 and the U19 annotation remain) |
| CANCELLED | 1 | `apex-dns-cutover` (D-21, moved to Phase 1) |
| PENDING | 26 | everything else |

## Part B — changes this child executes

Native KBD changes, registered under `uar-integration::uar-capability-assessment`. None writes product code.

| # | Change | Tasks | Done when |
|---|---|---|---|
| B1 | `record-decisions` | Write D-2, D-21, D-22, D-23 (table above) to `.kbd-orchestrator/phases/uar-integration/decision-log.md`. Append them to `.prometheus/decisions.md`, which is append-only. | Both files carry the four entries with dates and the operator's words. |
| B2 | `revise-parent-plan` | Rewrite `.kbd-orchestrator/phases/uar-integration/plan.md` as revision 3 from Part A. Keep the prior plan text under a "Superseded (revision 2)" heading; do not delete it. | The parent plan lists all 36 registered changes with order, owners and §9 references. A grep check confirms every §9 Phase 0 change id appears in it. |
| B3 | `emit-openspec-changes` | Create `openspec/changes/<id>/` (proposal, tasks, spec delta) for the 24 new changes from §9 rows plus Part A amendments. Edit the existing changes' `tasks.md` and titles per A1. Run `openspec validate --strict` on every change. | 24 new changes plus the edited existing ones all pass `openspec validate --strict`. |
| B4 | `reconcile-kbd-state` | Register the 24 new changes and their tasks in the parent phase. Complete `uar-kb-retrieval-embedding`, `memory-server-ghcr-publish` and `gate-ec-jwks-deploy` only after running each one's done-when check, with its output recorded. Explicitly transition `uar-jwks-es256` and `gate-ci-gitops` to IN_PROGRESS. In this project IN_PROGRESS is set, not derived from task counts. `site-chat-proxy` is already IN_PROGRESS. Cancel `apex-dns-cutover` with reason D-21. | `prometheus kbd status` for `uar-integration` shows exactly the A3 state table: 36 changes, DONE 6, IN_PROGRESS 3, CANCELLED 1, PENDING 26. The waypoint names a Phase 0 change. If a done-when check fails, that change stays at its prior state and the table's counts are re-stated in the B4 record. |
| B5 | `file-uar-roadmap` | Draft the UAR upstream items as issue texts in `.kbd-orchestrator/phases/uar-integration/children/uar-capability-assessment/uar-roadmap.md`. Each item carries its general-use benefit, its risk to other uses, and its evidence:<br>• session delete + TTL<br>• tool policy over built-in `ModelOnly` tools<br>• default chunker<br>• input screening on every entry point<br>• usage on cancelled runs<br>• usage on non-streaming responses (`server.rs:6585` returns `usage: None`)<br>• Dependabot ignore rule for deliberately pinned crates<br>**Filing them in the UAR repo waits on D-12.** | The draft exists. Filing happens only after D-12 is recorded. |
| B6 | `paper-corrections` | Update `docs/agent-led-site/`:<br>• §3.3: the stale conversion figure, with the retail-panel qualifier.<br>• **Wherever the paper says the ceiling is flint-gate's:**<br>&nbsp;&nbsp;– §6.2 T1 (`06-security-privacy.md:24`)<br>&nbsp;&nbsp;– §6.4 item 4 and the §9 checklist row 4<br>&nbsp;&nbsp;– FR-36 (`08-functional-spec.md:187`) and the Cost requirement (`08-functional-spec.md:254`)<br>&nbsp;&nbsp;Each now names the site-server reserve-and-settle meter, with gate optional.<br>• §9 rows amended in A2 (N9, N14, N15, N24) and the A1 edits.<br>• §10: U3 (config path), U12 (risk accepted by the operator, still open), U18 (mechanism per N15).<br>• The D table:<br>&nbsp;&nbsp;– D-2 recorded as an accepted risk.<br>&nbsp;&nbsp;– D-3 re-worded: a daily and a monthly token budget for the meter.<br>&nbsp;&nbsp;– D-4 re-worded: whether to feed the meter to gate; the store is decided as `site/meter` in SurrealDB.<br>&nbsp;&nbsp;– D-18 re-worded: gate credential custody; the budget values move to D-3.<br>&nbsp;&nbsp;– D-21 to D-23 added.<br>Then reassemble `agent-led-site.md`. | `grep -rn "ceiling at flint-gate\|ceiling is flint-gate\|ceiling is flint-gate's" docs/agent-led-site` finds nothing outside text marked superseded. `grep -c "D-21\|D-22\|D-23"` finds each one in the D table. The assembled file is regenerated from the sections. |

**Order:** B1 → B2 → B3 → B4. B5 and B6 run in parallel with B2–B4.

**Integration gate for this child** (one run, after B1–B6):
- `openspec validate --strict` across all changes;
- `prometheus kbd status` matches A1/A2;
- a grep check that every §9 Phase 0 change id appears in the parent plan and in OpenSpec.

## Risks

- **N15 is not a design §9 reviewed.** §9 chose gate. This plan moves enforcement to the site server because gate cannot see usage. The meter's correctness depends on:
  - reservation before forwarding, so an unreported run is counted at its maximum;
  - an atomic conditional update in SurrealDB per reservation and per settlement;
  - pinning the upstream request to one dialect (N14).
  It also gives the site server a database credential it did not have before. That credential is scoped to `site/meter` and created out of band. Fail-closed means a SurrealDB outage takes the chat offline. That is deliberate, and it is visible to visitors.
- **The phase grows from 12 to 36 registered changes (26 pending after B4).** The visible milestone (public site) moves to a later phase. That is §9's intent, not a side effect.
- **B4 rewrites canonical state for 36 changes.** A failed or partial transition leaves projections inconsistent (see the gotchas on suppressed `end-task` output). B4 runs the transitions one by one and stops on the first failure.

## The uncomfortable part

The paper was written two days ago, and nobody turned it into a plan. Instead, a plan written before the paper kept executing. This child's real output is putting the paper's plan in charge, plus five amendments. Most of those amendments came out of review rounds that caught my own errors about UAR's budget code, so the spend-ceiling design (N15) still needs one deployed measurement before anyone trusts it.

## Plan review round 1: disposition

| Finding | Disposition |
|---|---|
| CRITICAL: non-streaming turns unmetered | Accepted. Verified `server/src/domain/chat_request.rs:50-53` (defaults `false`) and UAR `server.rs:6585` (`usage: None`). N14 forces streaming upstream; N15 depends on it; done-when tests a `stream:false` request; B5 files non-stream usage. |
| WARNING: one-replica interim vs `replicas: 2`, rollouts | Accepted. Meter total moves to SurrealDB with a scoped user; replicas stay at 2; done-when covers rollouts and two replicas. |
| WARNING: chunking/seed cycle; config only on create | Accepted. N9 owns the seed-script change plus `--recreate-kb`; `site-agent-seed` no longer carries it. |
| WARNING: backward dependency, missing critical-path blockers, unjustified edge | Accepted. `uar-jwks-es256` closes after `ci-supply-chain-pins`; D-18, D-3, D-4 named; `ci-secrets-out → cluster-extauthz-policies` edge removed. |
| WARNING: exit-criterion text and D rows not updated | Accepted. B6 covers §6.4 item 4, checklist row 4, D-3/D-4/D-18; grep-able done-when. |
| WARNING: U12 "closed by decision" | Accepted. D-2 recorded as an operator-accepted risk; U12 stays open. |
| WARNING: B4 states not KBD states | Accepted. A3 state table with counts; B4 done-when checks it. |
| SUGGESTION: N8 evidence repos | Accepted. Owner/repo cited. |

## Plan review round 2: disposition (final round; no round 3)

| Finding | Disposition |
|---|---|
| CRITICAL: meter bypass through `stream_mode: agui_spec` | Accepted, and fixed as a class rather than a field. The meter reserves before forwarding and keeps the reservation unless `agui.done` settles it, so an unreported run of any shape is counted. N14 also pins `stream` and `stream_mode`. Done-when (1)–(2) test both bypass fields and a disconnect. |
| WARNING: credential scope, root in CI, NetworkPolicy "on a user", outage behaviour | Accepted. Separate `site/meter` ns/db and a database-scoped user; created out of band by the operator; the NetworkPolicy is pods and ports only; fail closed, tested by done-when (5). |
| WARNING: FR-36, the Cost requirement and T1 still name gate; alert missing; monthly cap unenforced | Accepted. B6 covers all three; alerts at 80% and exhaustion with done-when (6); a monthly token budget enforces D-3 until pricing exists. |
| WARNING: no atomicity, overshoot unbounded, sequential-only tests | Accepted. Atomic conditional reservation; no overshoot by construction; done-when (3) is a concurrent boundary test. |
| WARNING: chunking/seed cycle on the deployed leg | Accepted. N9's done-when is the local pass; the deployed FR-8 check belongs to `site-agent-seed` 1.6 (1.3 is the local gate) and reopens N9 on failure. |
| WARNING: B4 IN_PROGRESS not tasked | Accepted. B4 transitions `uar-jwks-es256` and `gate-ci-gitops` explicitly. |
| SUGGESTION: server-side aggregation unnecessary | Accepted. Removed; the client's title path already reads a stream. |
| SUGGESTION: per-session limits are not a per-visitor layer | Accepted. Relabelled a per-conversation bound. |
| SUGGESTION: "35 active" leftover | Accepted. Fixed. |

## Unresolved review findings

None open as findings. The plan was reviewed twice by the same model family, because no distinct judge model is configured. The round-2 revisions, especially N15's reserve-and-settle design and its SurrealDB scope, **have not been re-reviewed**. N15's done-when (1)–(6) is the first independent check of the design. It must pass on the deployed stack before the spend ceiling counts toward Phase 0 exit.
