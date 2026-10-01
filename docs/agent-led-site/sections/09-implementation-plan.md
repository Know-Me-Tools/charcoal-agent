# 9. Implementation plan

Owner: km-product-owner. Status: proposal, 2026-10-01. The requirements are in section 8. The active KBD phase is `uar-integration`, with `site-chat-proxy` task 1.5 next.

Each change below is an OpenSpec change under `openspec/changes/<id>/`. Every change ends with its integration gate, a km-qa-engineer verification and an independent review through `artifact-critic` or `adversarial-review`. Then it is archived. Sizes: **S** is one or two files and a session; **M** is one feature slice; **L** is more than one slice and must be split into tasks before work starts. Copy that lands in `content/**`, `src/pages/**` or `public/**` needs the operator's recorded approval in `docs/content/reviews/<piece-id>.md` first. Operator decisions are numbered D-1 to D-20 and listed in one table at the end of this section.

**Launch shape.** Phase 0 makes the site safe to deploy, not public. Phase 1 is the public launch: prerendered pages and the cited text concierge, with the DNS cutover as its last change. Phase 2 builds the widget board as an opt-in, labelled sandbox (FR-43). It becomes the default only when Phase 2's enforcement evidence exists and the operator records D-11. Phase 3 tests whether the agent-led site beats the static site.

## Phase 0: safe to deploy, not public

**Goal.** Finish the `uar-integration` deployment work and close the security, privacy and compliance gaps, so the stack can run on the cluster with its controls proven. `know-me.tools` stays on Lovable throughout Phase 0. Every Phase 0 exit criterion depends only on Phase 0 work.

**Where the gate runs (D-1).** No staging environment exists, and CI smoke runs against production. Unless the operator provisions staging, every gate in this phase runs against the production deployment on its cluster hostname. Not public does not mean unreachable: anyone who sends `Host: know-me.tools` to the gateway reaches the deployment. Gates therefore run only after the Phase 0 controls they test are deployed, and a result taken before then does not count.

### Remaining `uar-integration` work (existing changes)

| Change | Remaining | Owner | Size |
|---|---|---|---|
| `site-chat-proxy` | 1.5: Axum server; the crate exists in `server/`, the task is not closed. 1.4: integration gate and visual capture. | km-rust-engineer, km-frontend-engineer | M |
| `uar-kb-retrieval-embedding` | 1.4: PR link, and confirm the published image contains the fix | km-rust-engineer | S |
| `local-compose-stack` | 1.4: four-service gate | km-devops-engineer | S |
| `site-agent-seed` | 1.3: gate, run after `kb-chunking-quality`. Add the KB health check (FR-8), because the KB was empty when the 8,732-token figure was measured. The script already re-uploads documents whose ingestion failed, which covers transient network errors to DashScope. Its site-key minting (`--mint-key-to-file`, `--mint-key-to-k8s-secret`) is removed by `gate-site-credentials`. | km-devops-engineer | S |
| `memory-server-ghcr-publish` | 1.4: manifest and `/health` | km-devops-engineer | S |
| `k8s-stack-manifests` | 1.4: render and dry-run. Must not contain the `runtime.know-me.tools` HTTPRoute (see `uar-runtime-host-lockdown`). | km-devops-engineer | S |
| `github-deploy-workflows` | 1.4: green `main`, then a redeploy. **Add a task: fix the chat smoke test.** It sends `"stream_mode":"dual"` but greps for `"type":"TEXT_MESSAGE_CONTENT"`; dual emits `agui.message.delta` with no `type` field, so the step can never pass. Grep for the dual event, or send `agui_spec`, matching the dialect the client uses (FR-13). Also move the `runtime.know-me.tools` checks per FR-37. | km-devops-engineer | S |
| `about-endpoint-truth` | 1.2: visual capture | km-frontend-engineer | S |

`apex-dns-cutover` is not Phase 0 work. It moves to the end of Phase 1.

### New changes (before Phase 0 exits)

| Change | What | FRs | Owner | Depends on | Size |
|---|---|---|---|---|---|
| `ci-secrets-out` | **Lands before the first deploy.** Remove `UAR_JWT_SECRET`, `UAR_SETTINGS_ADMIN_KEY` and `SURREALDB_ROOT_PASSWORD` from CI (`site.yml` lines 104-128, 167). Create the UAR Secret once, out of band. Replace the seed job's JWT minting with a gate-minted token for its seed identity; once `jwks_url` is set, UAR rejects self-minted HS256 tokens. Deploy job behind a GitHub environment with required reviewers; Secret verbs restricted by `resourceNames`. Closes §6.4 item 2. | NFR security | km-devops-engineer; operator (Secret creation); km-security-officer reviews | `gate-site-credentials` (seed identity); blocks the first deploy | S |
| `uar-runtime-host-lockdown` | **Lands before the first deploy.** Delete the `runtime.know-me.tools` HTTPRoute from the manifests. Because the deploy cannot prune or delete, also delete any applied route explicitly with operator credentials, and verify with `curl` that no UAR endpoint answers on the host (`/metrics` and `/admin` are served once a route attaches). Rewrite the CI steps that call the host. A NetworkPolicy so only `knowme-web` and flint-gate reach `uar:6565`; whether the seed job also needs direct access is an OPEN QUESTION settled in this change. | FR-37 | km-devops-engineer; operator (route deletion); km-security-officer reviews | none; blocks the first deploy | S |
| `uar-jwks-es256` | UAR change: the JWKS verifier accepts ES256 and ES384 as well as RS256, with each key bound to one algorithm, so UAR can verify gate-minted tokens. Merged as Prometheus-AGS/universal-agent-runtime#321, with 9 integration tests; the image build is in progress. Done when a pinned UAR image carries it (`ci-supply-chain-pins`). | FR-46 | km-rust-engineer with the UAR maintainers | none; blocks `gate-site-credentials` | S |
| `gate-ec-jwks-deploy` | Deploy Know-Me-Tools/flint-gate#10, which keeps the `pem` member and adds `crv`, `x` and `y` (7 of 7 `jwks_publish` tests pass locally). The deployed gate JWKS publishes its ES256 key without them, so no standard verifier can use it; Forge and FRF parse it with `jsonwebtoken` JwkSet too, so they need the fix as well. In progress: flint-infra's `images.yaml` builds #10 merged onto current gate main, then a know-me-cluster PR bumps the digest. Done when `https://gate.know-me.tools` serves a JWKS whose EC key carries `kty`, `crv`, `x` and `y`. | FR-46 | platform (gate); km-devops-engineer verifies | none; blocks `gate-ext-authz-endpoint` | S |
| `gate-ext-authz-endpoint` | flint-gate has no external-authorization endpoint. Add an HTTP `POST` check endpoint that reuses gate's `kratos`, `jwt`, `api_key` and `anonymous` providers and its JWT minting (about 200 lines): allow or deny, inject `Authorization: Bearer <gate-minted ES256 JWT>` on allow, strip client-supplied auth headers. Integration tests with Envoy-shaped check requests. Deployed before any SecurityPolicy references it. | FR-47 | platform; km-security-officer reviews | `gate-ec-jwks-deploy` | M |
| `gate-site-credentials` | The site and seed identities in gate, and the token path for each. **OPEN QUESTION settled here:** `/oauth/token` client credentials (enabled and guarded) or token exchange from a database-backed gate API key. The site credential goes in Secret `site-proxy` in place of the UAR `X-API-Key`. Tokens carry `sub` = the site identity that owns the agent and KB, `aud` = `uar` and a short TTL. Configure UAR with `UAR_SECURITY__JWKS_URL`, `UAR_SECURITY__JWT_ISSUER` and `UAR_SECURITY__JWT_AUDIENCE`. Point the site server at the token path; remove the seed script's site-key minting and the workflow's `--mint-key-to-k8s-secret`. Check whether a key valid for one gate route is accepted on another, and close it with a Cedar authorize hook if so. Test: after a UAR restart a chat turn authenticates as the site identity with the KB available; a request without a gate JWT, or with a self-minted HS256 token, gets 401. Closes §6.4 item 17. | FR-46 | platform (gate); km-devops-engineer; km-rust-engineer (site server); km-security-officer reviews | `uar-jwks-es256`, `gate-ec-jwks-deploy`, `gate-ext-authz-endpoint`, D-18 | M |
| `cluster-extauthz-policies` | Per-route SecurityPolicies in know-me-cluster (`gateway.envoyproxy.io/v1alpha1`, `spec.extAuth.http`, timeout about 200 ms), staged. Phase 0: `knowme-site` and `knowme-www` anonymous-allow with `failOpen: true`, and `knowme-runtime` fail-closed if D-7 keeps it. Test that `know-me.tools` serves with gate down. Write `docs/break-glass-securitypolicy.md` in know-me-cluster: Argo CD's selfHeal re-creates a policy deleted with `kubectl`, so suspend auto-sync for the app (or revert the policy commit and sync), then delete the policy. After Phase 0, a separate staged rollout adds `forge-quarry` and `frf` (Kratos session, fail closed), and `sso-broker` per D-19; it is not a site phase gate. Closes §6.4 item 18. | FR-47 | km-devops-engineer; platform; km-security-officer reviews | `gate-ext-authz-endpoint`, `gate-site-credentials` | M |
| `gate-ci-gitops` | Gate's home is the know-me cluster only. Its CI stops deploying to the `ssr` cluster. Images stay `ghcr.io/prometheus-ags/flint-gate`, built by flint-infra `images.yaml`, and digest bumps land through know-me-cluster PRs. flint-infra's `deploy.yaml` also applies to the namespace Argo CD manages (D-20). | none (deploy path for the gate changes) | platform; km-devops-engineer | D-20 | S |
| `kb-chunking-quality` | The KB's `Recursive { size: 512 }` chunker splits at periods inside version numbers and produces 32- to 50-character fragments that score highest; the agent then misses facts the corpus states (§4.8). First a decision-log entry: a UAR chunker change (a minimum chunk size, or a sentence splitter that respects version numbers) or a corpus-side workaround. Then the fix, and the FR-8 chunk checks. The `site-agent-seed` gate and the text golden set run only after it lands. | FR-8 | km-rust-engineer (UAR option), km-chief-content-officer (corpus option), km-devops-engineer | none; blocks the `site-agent-seed` gate and `site-agent-eval-text` | S |
| `site-agent-tool-allowlist` | The launch run policy is already in `uar/agents/knowme-site.json` and was seeded locally on 2026-10-01: tools `selected` with no ids, skills and MCP servers `none`, `tool_approval: deny` (§4.7). This change commits it, deploys it, and proves it. Inject `memory_enabled: false` at the proxy (FR-41). File the `activate_skill` review entry in §6.2 T2. Add the FR-11 test, which reads the run's `effective_run_policy` and `turn_manifest` through a proxy test harness or from the seed job, and asserts mode, set-equal ids, `deny` while the list is empty, and `selected_tools` equal to the allowlist plus `activate_skill`. Add the tool-eliciting prompt set with a forced-call fixture on `activate_skill` that must yield `agui.tool_call.denied`. Measure input tokens on the deployed agent and record them against the local figures: 8,732 under `Auto` with an empty KB, and 1,425 to 1,459 per turn under the launch policy with the KB populated (2026-10-01). | FR-11, FR-41 | km-rust-engineer; km-conversational-designer (prompt set); km-security-officer reviews | `site-agent-seed`, `site-proxy-artifact-filter` | M |
| `site-proxy-artifact-filter` | Drop `agui.artifact` events whose `artifact_type` is `effective_run_policy` or `turn_manifest` on the public path. Provide the test harness hook FR-11 uses to read them before the filter. | FR-45 | km-rust-engineer; km-security-officer reviews | `site-chat-proxy` | S |
| `site-session-erasure` | Erasure without a UAR session delete. An operator-scheduled purge of `sessions`, `checkpoints`, `cost_ledger` and `tool_admission_evidence` (and `memory` if it is ever enabled) for the `knowme-site` owner past the retention period. A published, request-based erasure process for a named session. A direct SurrealDB test per store for a purged and for an erased test session. Separately, file the UAR change for a session delete and a persisted-session TTL (D-12); FR-20's delete control waits on it and is not a Phase 0 gate. | FR-33 | km-devops-engineer (purge); km-security-officer (process); km-rust-engineer (UAR change) | `site-chat-proxy`, D-5 | M |
| `site-session-binding` | Proxy issues a signed, HttpOnly first-party cookie. Upstream session id = `HMAC-SHA256(secret, cookie_id ‖ thread_id)`, stateless, so it holds across replicas. Applied to chat completion and resume. UUIDv4 check on the thread id. A two-visitor isolation test per route, run with two proxy replicas. Secret held in a Kubernetes Secret with a rotation note. | FR-34 | km-rust-engineer; km-security-officer reviews | `site-chat-proxy` | M |
| `site-proxy-hardening` | Remove `GET /api/sessions/{id}/messages` and `DELETE /api/sessions/{id}` from the allowlist (dead upstream), and their client callers, `src/hooks/use-sessions.ts` and the persisted-thread fallback in `src/features/chat/use-chat-messages.ts`. Remove `POST /api/uar/runs/{run_id}/artifact-response`, which nothing uses in Phase 0. Map upstream non-2xx to a generic `AppError` body (`upstream.rs:58-63` passes them through) and log upstream 5xx without session id or body (today they appear only in the INFO response line). Forward no query string except allowlisted parameters. | FR-5, FR-42 | km-rust-engineer; km-frontend-engineer (callers); km-security-officer reviews | `site-chat-proxy` | S |
| `site-spend-ceiling` | The ceiling is flint-gate's: set the `max_token_budget` per-identity token budget and the per-credential rate limit on the site identity to the D-3 and D-4 values, and test that an exhausted budget refuses the next turn and the proxy shows the offline state. Keep the site server's per-IP limiter as the first layer. Set the site model's `max_output_tokens` in UAR settings (the agent policy has no `max_tokens` key). Title requests use the same site token. Record how `max_token_budget` learns a run's tokens, given gate does not proxy the site's UAR calls, and whether it counts disconnect-cancelled runs (§4.8). Kill switch read from a mounted ConfigMap file, effective within 60 seconds with no redeploy. A provider-side spend alert. Per-turn usage records (FR-38). | FR-36, FR-38 | km-devops-engineer (gate budget, ConfigMap, UAR settings); km-rust-engineer (proxy); km-security-officer reviews | `site-chat-proxy`, `gate-site-credentials`, D-3, D-4, D-18 | M |
| `site-security-headers` | CSP in report-only mode with the theme-script hash (check whether PGlite needs `wasm-unsafe-eval`), enforced after a clean week; HSTS at Envoy; `Permissions-Policy` | NFR security | km-rust-engineer, km-devops-engineer | `site-chat-proxy` | S |
| `ci-supply-chain-pins` | Pin every GitHub Action by commit SHA, and the UAR and memory-server images by digest, in the workflows and manifests. A CI check fails on an unpinned action or a tag-only image. Closes §6.4 item 13. | NFR security | km-devops-engineer | none | S |
| `site-ai-disclosure-label` | Static label beside the composer and on the first agent bubble; `data-ai-generated` on agent messages; the sensitive-data hint. The copy goes through the approval gate. | FR-31, FR-35 | km-frontend-engineer; copy from km-conversational-designer and km-chief-content-officer | none | S |
| `site-retention-and-privacy` | Log retention with no session ids in access logs. A privacy notice that names every store, the retention period, the request-based erasure process and the data-request contact, and states only what FR-33 and FR-41 have been shown to do. | FR-32 | km-security-officer (policy), km-devops-engineer (config), km-chief-content-officer (notice) | `site-session-erasure`, D-5, D-6, D-8 | M |
| `site-citation-link-allowlist` | `citation-block.tsx` renders any URL today. Render a citation URL as a link only if it matches a corpus URL string or a host on the site-owned allowlist; otherwise plain text. | FR-16 (citations) | km-frontend-engineer; km-security-officer reviews | none | S |
| `site-chat-offline-states` | Client states for agent offline, spend ceiling and kill switch, and 429 with wait time. The "Blocked by policy" case for `agui.tool_call.denied`. They ship in Phase 0 because the spend ceiling and the kill switch need a visible state on the deployed stack. | FR-11 (client case), FR-27, FR-28 | km-frontend-engineer | `site-spend-ceiling` | S |
| `site-agent-prompt-fixes` | Not done yet: the prompt in `uar/agents/knowme-site.json` still carries both. Remove the "About or Contact page" instructions: `/settings/about` 404s in the site build and no contact page exists. In Phase 0 the agent names no site routes; it offers the in-chat company topic instead. Add the tool-scope line (5.5). Self-identify as "the KnowMe agent". | FR-6, FR-7, FR-9 | km-conversational-designer | `site-agent-seed`, `site-agent-tool-allowlist` | S |
| `site-agent-eval-text` | Text-only golden set (5.8) in `docs/conversation/eval/`, with a scripted runner, run only after `kb-chunking-quality` lands. Includes the pricing and contact items, the tool-eliciting items and `activate_skill` fixture from `site-agent-tool-allowlist`, and link items for FR-16. Route items for FR-6 and FR-9 join in Phase 1. No surface items. | NFR quality (text), FR-6, FR-7, FR-9, FR-11 | km-conversational-designer, km-qa-engineer | `site-agent-prompt-fixes`, `kb-chunking-quality` | M |
| `site-redteam-prompts` | Red-team prompt set (injection, persona override, prompt extraction, tool elicitation, cross-visitor probes, link smuggling) run against the deployed controls. Results filed in `docs/security/`. Closes §6.4 item 6. | NFR security | km-security-officer; km-qa-engineer runs | `site-agent-tool-allowlist`, `site-session-binding`, `site-citation-link-allowlist` | S |

**Gate ordering.** UAR ES256 verification (merged) and the gate JWKS fix deployed, then gate's check endpoint, then the site and seed credentials, then the knowme route policies. `ci-secrets-out` needs the seed identity, so the first deploy waits on `gate-site-credentials`.

### Section 6.4 checklist to Phase 0 change

| §6.4 item | Closed by |
|---|---|
| 1. Runtime host removed or restricted | `uar-runtime-host-lockdown` (before the first deploy) |
| 2. Signing secret, admin key and DB password out of CI | `ci-secrets-out` (before the first deploy) |
| 3. Token Plan terms or a capped pay-as-you-go key | Operator, D-2 |
| 4. Spend ceiling at flint-gate, kill switch, `max_output_tokens` | `site-spend-ceiling`, `gate-site-credentials` |
| 5. Launch run policy proven through policy and manifest | `site-agent-tool-allowlist` |
| 6. Red-team prompt set | `site-redteam-prompts` |
| 7. Static AI label | `site-ai-disclosure-label` |
| 8. Privacy notice with data-request contact | `site-retention-and-privacy`, D-8 |
| 9. Purge of every store and request-based erasure | `site-session-erasure` |
| 10. Session-id validation and HMAC binding | `site-session-binding`, `site-proxy-hardening` (callers) |
| 11. Generic upstream errors, artifact-response removed, internal artifacts dropped | `site-proxy-hardening`, `site-proxy-artifact-filter` |
| 12. Citation-link allowlist | `site-citation-link-allowlist` |
| 13. SHA and digest pins | `ci-supply-chain-pins` |
| 14. CSP, HSTS, Permissions-Policy | `site-security-headers` |
| 15. Log retention, no session ids in logs | `site-retention-and-privacy` |
| 16. Text-only golden set | `site-agent-eval-text` (after `kb-chunking-quality`) |
| 17. UAR accepts only gate-minted tokens | `uar-jwks-es256`, `gate-ec-jwks-deploy`, `gate-site-credentials` |
| 18. Ext_authz policies and break-glass documented | `gate-ext-authz-endpoint`, `cluster-extauthz-policies` |
| 19. A2UI component allowlist | Phase 2 (`site-surface-registry`). Not a Phase 0 gate: no surface can render before Phase 2. |

**Exit criteria.** Each depends only on Phase 0 work, and each deployed check ran after the controls it tests were deployed.
- Every §6.4 item from 1 to 18 has evidence filed in the change mapped to it above.
- FR-46 passes: after a UAR restart, a chat turn with a gate-minted token authenticates as the site identity with the KB available, and a request without a gate JWT, or with a self-minted HS256 token, gets 401.
- FR-47 passes for the knowme routes: with gate down, `know-me.tools` still serves, and the break-glass runbook exists in know-me-cluster.
- FR-11 passes on the deployed agent: `tools.mode ∈ {none, selected}` with `tools.ids` set-equal to the D-15 list, skills and MCP servers `none` unless listed, `tool_approval == deny`, `turn_manifest.selected_tools` equal to the allowlist plus `activate_skill`, and memory disabled. The tool-eliciting set executes no tool; the `activate_skill` forced-call fixture yields `agui.tool_call.denied`. The re-measured token count is recorded.
- A public-path stream carries no `effective_run_policy` or `turn_manifest` artifact.
- `runtime.know-me.tools` answers with no UAR endpoint, verified after the first deploy.
- The fixed chat smoke test passes in CI.
- The text-only golden set passes against the deployed agent (D-1).
- The operator has recorded D-2, D-3, D-4, D-5, D-6, D-8 (the data-request contact), D-16 and D-18 in the decision log.

## Phase 1: public launch

**Goal.** This is the public launch. The site is complete and measurable with no widgets: prerendered pages, the four chips and the cited text concierge. The DNS cutover is the last change, after every other exit criterion passes. Phase 1 is also the whole product if Phase 2 fails.

| Change | What | FRs | Owner | Depends on | Size |
|---|---|---|---|---|---|
| `site-prerender-baseline` | **First, a decision-log entry choosing the prerender approach.** FR-1 needs the React chips and composer in the initial HTML, which a Markdown generator cannot produce, and `npm run build` is plain `vite build` with no topic routes. The options are React SSG (or React Router Framework mode prerendering), or static HTML pages plus a hydrated chat island on `/`. Spike `/` and one topic route each way and compare FR-1, the 150 KB budget and build complexity. Then emit one HTML page per topic route from `content/`, embedded through `build.rs`. | FR-1, FR-23, FR-24 | km-frontend-engineer; km-product-owner records the decision | Phase 0 | L |
| `site-topic-pages-content` | Approved page copy placed in `content/site/**` | FR-24 | km-chief-content-officer, via the full content route | none | M |
| `site-about-page` | A real `/about` page from approved copy, prerendered and passing FR-23. | FR-23 | km-chief-content-officer (copy), km-frontend-engineer (route) | `site-prerender-baseline`, `site-topic-pages-content` | S |
| `site-agent-prompt-about-link` | Once the topic pages and `/about` pass FR-23 in the deployed build, the prompt may name them. Golden-set route items added. | FR-6, FR-9 | km-conversational-designer | `site-about-page`, `site-agent-prompt-fixes` | S |
| `site-seo-metadata` | Titles, canonicals, sitemap, JSON-LD and `llms.txt` | FR-25, FR-26 | km-marketing-officer | `site-prerender-baseline` | M |
| `site-entry-chips` | Four static chips: links without JS, thread starters with JS. Chip-answer cache is optional. | FR-1 to FR-4 | km-conversational-designer (copy), km-frontend-engineer | `site-prerender-baseline` | S |
| `site-chat-failure-states` | Partial answer with Retry; budget, guardrail and cancel states. Offline, 429 and "Blocked by policy" shipped in Phase 0. | FR-29, FR-30 | km-frontend-engineer | `site-chat-offline-states` | S |
| `site-stream-resume` | Forward the run id and `Last-Event-ID`; read the run id from `agui.stream.start.request_id`; resume bound by FR-34. | FR-10 | km-rust-engineer, km-frontend-engineer | `site-session-binding` | S |
| `site-turn-metrics` | Prometheus counters, plus a TTFT and token baseline | FR-38, FR-39 | km-rust-engineer | `site-spend-ceiling` | S |
| `site-analytics-events` | Cookieless section 7.4 event set and a north-star dashboard. `handoff_clicked` per FR-44, with the handoff destination list in the decision log before baseline collection starts. No experiment bucket. | FR-40, FR-44 | km-marketing-officer; km-security-officer reviews | `site-entry-chips` | M |
| `apex-dns-cutover` | Existing change, tasks 1.1 to 1.3. **Runs last**, after every other Phase 1 exit criterion and a re-run of §6.4 items 5, 6, 10 and 16 against the build that goes public. | none | operator; km-devops-engineer verifies | every other Phase 1 change, D-17 | S |

**Exit criteria.**
- A crawler fetch of every topic route, including `/about`, returns its body text.
- Lighthouse budgets pass on `/` and every topic page.
- axe reports zero serious or critical issues, and a screen-reader pass confirms one status announcement per turn and no per-token announcements.
- Events arrive for a scripted session, and `handoff_clicked` fires identically from a page link and from a chat answer.
- The operator has recorded D-17 (counsel's confirmations).
- §6.4 items 5, 6, 10 and 16 re-pass against the build that goes public.
- `apex-dns-cutover` 1.3 passes.
- After the cutover, four weeks of baseline data exist: sessions per week, `handoff_clicked` rate, TTFT and cost per conversation. This is the input to the feasibility check below, not a launch condition.

**Experiment feasibility check, recorded before Phase 2 starts.** From the measured baseline rate, compute the per-arm sample for a 20% relative lift (two-sided α = 0.05, power 0.8). At a 3–5% baseline that is about 8,200–13,900 per arm. At a 1% baseline it is about 43,000 per arm. The real baseline is likely below 3%, because the only handoff target at launch is The Boss's GitHub releases link (no contact page, no waitlist). For comparison, a 50% lift needs about 1,500–2,500 per arm, but the target is fixed at 20% before launch and is not swapped for a larger lift later. If baseline weekly sessions cannot reach the per-arm sample for two arms within 12 weeks, record that the experiment is infeasible and the pre-declared outcome is HOLD. There is no calendar-week alternation or other sequential fallback design.

## Phase 2: widget sandbox

**Goal.** The agent can put cited, validated widgets on a per-visitor board, inside an opt-in, labelled sandbox (FR-43). The public path stays the Phase 1 text concierge.

| Change | What | FRs | Owner | Depends on | Size |
|---|---|---|---|---|---|
| `site-a2ui-catalog-decision` | Decide between a site catalog ID that UAR accepts, or widgets built as presentation templates from UAR's nine components. Neither path renders links, URLs, images or citations today, so either path needs an **upstream UAR catalog change**, filed in this change with the UAR maintainers. Also propose the sandbox allowlist entry, `presentation_render`, with its §6.2 T2 review entry, for D-15 (§8.10); `a2ui_render` is a separate candidate, gated by `tools` in the same way. Record which route clears the `activate_skill` precondition (§4.7): the UAR change, or the non-hang test. Spike one widget that needs no link component each way. | none (decision) | km-product-owner with the UAR maintainers; km-rust-engineer spikes | Phase 1, D-12 | S |
| `site-surface-registry` | First a decision-log entry: stay on `dual` and order by SSE `id`, or migrate the client to `agui_spec` and use `sequence` and `eventId` (FR-13). Then the client v0.9.1 projection; a `SurfaceStore` applying `agui.state.patch` in order with replay deduplication; frozen registry; schema validation; unsupported placeholder. | FR-12, FR-13 | km-frontend-engineer | decision | L |
| `site-proxy-presentation` | On the sandbox path only: inject `presentation_mode` and `client_rendering`; set the sandbox tool allowlist and `presentations` in mode `selected` with the seeded template ids; `ui.artifacts.enabled: true`; templates seeded. `tool_approval: auto` only once the `activate_skill` precondition holds. If widgets need the action route (§4.3), it returns with a signed run token bound to the cookie (FR-34). The FR-11 test now asserts both paths. | FR-11, FR-14 | km-rust-engineer, km-conversational-designer | decision | M |
| `site-widget-sandbox` | The opt-in sandbox entry point (`noindex`), its visible "experimental" label, its own kill switch, and the run of red-team prompts against the sandbox path. | FR-43 | km-frontend-engineer, km-rust-engineer; km-security-officer (red-team) | `site-proxy-presentation` | M |
| `site-widget-catalog-cards` | `product-summary-card`, `unpublished-notice` first. `download-link-card`, `next-steps-card` and per-field citations only after the upstream catalog change ships in a pinned UAR image. Link allowlist on every widget. | FR-15 to FR-17 | km-creative-director (design), km-frontend-engineer | registry | M |
| `site-widget-catalog-tables` | `comparison-table`, `status-list`, `platform-availability`, `faq-accordion` | FR-15 | km-creative-director, km-frontend-engineer | registry | M |
| `site-visitor-board` | Pin store in PGlite; board and below-1024 px tabs; receipt and Undo; "Start fresh" clears local state. A "Delete conversation" control only if UAR has added a session delete (FR-20). | FR-19 to FR-22 | km-frontend-engineer | cards | M |
| `site-surface-eval` | Surface golden set: surface choice, text-first check and an injection set | FR-18 | km-conversational-designer, km-qa-engineer | `site-agent-eval-text` | S |
| `visitor-identity-via-gate` | Spike. No component of the stack issues guest identities, and gate's `anonymous` provider uses one fixed subject. Test whether the site server can carry a signed per-visitor UUID that gate maps into the minted JWT's `sub`, and how the KB stays readable under a per-visitor `sub`. If it works, it enables flint-forge (Quarry) row-level security on `auth.uid()` for the per-visitor board, live sync through flint-realtime-fabric and the prometheus-entity-management Flint adapter, and analytics as an insert-only RLS table in flint-forge. The outcome is a decision-log entry, not a shipped feature (§4.5). | none (spike) | km-rust-engineer; operator (gate); km-security-officer reviews | `gate-site-credentials` | S |

**Exit criteria (the enforcement evidence D-11 needs).**
- Every widget that has shipped renders from golden fixtures at 320 and 1440 px in both themes, and the captures have been viewed.
- A live sandbox turn pins a cited widget.
- On each path, the effective tool selection set-equals that path's approved allowlist, and the run's `turn_manifest.selected_tools` equals that list plus `activate_skill` unless UAR has dropped it.
- On the sandbox path, `presentations.mode == selected` with named template ids.
- The `activate_skill` precondition holds: either the UAR change has shipped in a pinned image, or a test shows an `activate_skill` call under `auto` is rejected and does not hang.
- If the action route exists, it rejects an action without a valid run token bound to the visitor's cookie.
- The surface eval passes, and the rejected-surface counter is at zero across the eval run.
- The sandbox red-team run shows no surface outside the agent region, no component outside the registry, and no link outside the allowlist.
- §6.4 item 19's component allowlist has evidence.

The opt-in does not protect against developers, who are the visitors most likely to open the sandbox. A sandbox misbehaviour is a brand incident under kill criterion 2.

**Timebox and fallback rule.** Phase 2 work before the upstream UAR catalog change ships is limited to the decision, the spikes, the registry and the widgets that need no link component. The two-week timebox for "a rendering, cited widget in the sandbox" starts when the upstream change is merged and published in a pinned UAR image, not when Phase 2 starts. If the upstream change is not merged within the operator-set wait limit (D-13, proposed six weeks from filing), or the widget does not render within the two weeks, stop Phase 2. Run Phase 3 against the text concierge instead (section 2.10).

## Phase 3: experiment and decision

| Change | What | Owner | Depends on | Size |
|---|---|---|---|---|
| `site-experiment-assignment` | Assignment only in the form counsel approves (D-10); no bucket until then. Server-side assignment is an option, but it does not reuse the FR-34 binding cookie. Static arm: chips link to topic pages, composer hidden. Chat arm: composer live, chips open chat, text concierge. A widget arm only if D-11 has graduated the sandbox (see below). Equal split. | km-marketing-officer; km-security-officer reviews | Phase 1 feasibility check passed, D-10 | M |
| `site-experiment-readout` | Pre-registered analysis, written before launch; one analysis at the fixed horizon; final report; decision-log entry | km-product-owner; km-cmo signs off the metric | assignment | S |

**Arms and what a result can credit.**
- The default design has two arms, static and chat. The chat arm is the Phase 1 text concierge, or chat plus widgets if the operator has graduated the sandbox (D-11). A GO credits the chat experience as a whole. Widgets are not separately creditable in the two-arm design.
- Widgets are credited only if an arm isolates them: a third arm, chat plus widgets, compared against a text-only chat arm. That arm exists only after D-11, and it raises the total sample by half.
- If widgets are in the chat arm, the 15% and one-third figures (at least 15% of chat sessions render a widget, and at least a third of those interact with it) are a **usage gate, not an effect**. Below them, the board is not being used, and widget work stops beyond maintenance whatever the primary result. Meeting them proves use, not that widgets caused any handoff.

**Pre-registration**, in the decision log before the first bucket is assigned:
- Primary metric: `handoff_clicked` rate per session, with the single FR-44 definition for every arm.
- Fixed horizon: the per-arm n for a 20% relative lift at the measured Phase 1 baseline (two-sided α = 0.05, power 0.8). That is about 8,200–13,900 per arm at a 3–5% baseline and about 43,000 at 1%. The exact n is written down before launch.
- One analysis, at the horizon. No interim looks and no early stopping on the primary metric. The only early stop is a guardrail or kill-criterion breach.
- Maximum run: 12 weeks. If 12 weeks end before every arm reaches n, the result is HOLD.
- Guardrails: Core Web Vitals per arm, cost per session, golden-set score, and security incidents.

**GO: the agent-led site becomes the default.** All of the following hold:
- The chat arm's handoff rate is higher, and the 95% interval of the difference excludes zero, at the fixed horizon.
- Chat-arm p75 LCP is under 2.5 s.
- Cost per qualified handoff is at or below the operator's ceiling (D-3).
- There were no brand incidents (kill criterion 2) during the run.
- If widgets are in the chat arm, the usage gate above is met. For widgets to be credited with the result, a three-arm run shows the widget arm beating the text-only chat arm on the same test.

**HOLD: keep chat as an optional assistant beside the static site.** This applies when there is no significant difference, when the horizon was not reached in 12 weeks, or when the Phase 1 feasibility check already said the horizon is out of reach. Stop widget work beyond maintenance, and keep the cheaper of the two experiences as the default.

**NO-GO: the static site becomes the default.** This applies when the chat arm is significantly worse on the primary metric, or breaches a guardrail. The chat is removed from the landing page or kept behind a link.

## Kill criteria for the whole idea

Stop the agent-led direction at any point if one of these happens:

1. The Token Plan terms forbid public use, and the capped alternative costs more than the operator's monthly cap at Phase 1 baseline traffic.
2. **One public misbehaviour is a brand incident**, in the text concierge or the sandbox. A misbehaviour is a confirmed fabricated product, price or status claim in production; an executed tool call outside the allowlist, including `activate_skill`; a link outside the allowlist; a surface outside the agent region; or another visitor's data shown to a visitor. One is enough, because a single screenshot discredits UAR as well as the site, and developers are the audience most likely to try. The incident on-call owner (D-16) turns the kill switch on the same day, and the sandbox closes. The agent returns only if a postmortem shows the cause is closed at the enforcement layer (policy, proxy or client), not by a prompt change, and the operator records a decision to resume (D-14). A second incident after a resume stops the direction.
3. Cost per qualified handoff stays above the operator's ceiling for four consecutive weeks after the kill switch and ceiling are tuned.
4. The public path's effective tool selection and turn manifest cannot be held to the approved allowlist with `deny` in force, or the purge of every store cannot be put in place. Then Phase 0 cannot exit and the site launches without the concierge.
5. The Phase 3 result is NO-GO.

## Risks

| Risk | Impact | Mitigation |
|---|---|---|
| A key in the `uar.run_policy` extension is malformed or misspelled and silently dropped, leaving tools in Auto | FR-11 fails, so Phase 0 cannot exit | FR-11 asserts the run's resolved policy and turn manifest, not the artifact text; kill criterion 4 |
| `activate_skill` stays exposed and `deny` stays the only lock | No allowlisted tool can run, so Phase 2 cannot start; loosening `deny` would expose `activate_skill` | File the UAR change in D-12, or write the non-hang test; FR-11 fails on any approval value other than `deny` until then |
| UAR has no session delete or TTL (confirmed, §4.5) | No per-conversation delete control (FR-20) | Phase 0 uses the operator purge of every store and the request-based erasure process; FR-20 ships only if the UAR change lands |
| The upstream catalog change for link, URL and citation components is slow or declined | Phase 2 cannot ship the link widgets | The D-13 wait limit and the fallback rule; Phase 1 is a complete product |
| The tool allowlist widens over time | The safety case erodes | Each addition needs a §6.2 T2 review entry and D-15; FR-11 asserts the exact list and manifest on each path |
| The deployed agent's input tokens rise above the local floor of about 1.45k per turn | Cost and TTFT floor | Measured on the deployed agent in Phase 0 and recorded per turn (FR-38); raise a UAR change to trim the run context for agents without tools or skills if it rises |
| The gate JWKS fix or gate's check endpoint is delayed | UAR cannot verify gate tokens, or no route policy can go in, so Phase 0 cannot exit | Both are Phase 0 changes (`gate-ec-jwks-deploy`, `gate-ext-authz-endpoint`); UAR API keys are not a fallback, because a restart invalidates them |
| A fail-closed SecurityPolicy or a gate outage locks out a service | The service is unreachable, and Argo CD's selfHeal re-creates a policy deleted with `kubectl` | Public routes fail open; Argo CD is not routed through the gateway; the break-glass runbook suspends auto-sync before deleting the policy |
| flint-infra's `deploy.yaml` and Argo CD both apply to gate's namespace | Split brain: the running gate may not be the one in know-me-cluster | D-20; `gate-ci-gitops` |
| Chunking stays poor | The agent misses or garbles facts the corpus states, and the golden set fails | `kb-chunking-quality` gates the seed gate and the golden set |
| Low traffic, and a handoff base rate below 3% | The experiment never reaches power | The Phase 1 feasibility check; HOLD is the honest outcome |
| The HMAC secret leaks or rotates | Rotation orphans server sessions; a leak lets someone derive ids only if they also hold a visitor's cookie | Secret in a Kubernetes Secret; rotation runbook; the purge deletes orphans |
| The pre-cutover deployment is reachable through a `Host` header | Anyone can reach the agent before Phase 0 controls are proven | Controls deploy before gates run; rate limits and the kill switch apply from the first deploy of the agent |
| Injected text produces a misleading but valid widget | Brand and trust | Sandbox only, marked agent region, no collection widgets, link allowlist, injection eval, kill criterion 2 |

## Operator decisions

Every decision below is the operator's. km-product-owner records each one, with name and date, in the phase decision log. Nothing that depends on a decision proceeds until it is recorded.

| ID | Decision | Needed by | Blocks | Default if not decided |
|---|---|---|---|---|
| D-1 | Provision a staging environment, or run every gate against production before DNS cutover | Phase 0 start | Phase 0 exit | Gates run against production before cutover, after the controls they test are deployed |
| D-2 | Confirm that the Qwen Token Plan terms permit public, unauthenticated use, or move to a capped pay-as-you-go key | Phase 0 exit | Phase 0 exit; kill criterion 1 | Phase 0 waits |
| D-3 | Spend numbers, set as flint-gate budget values: the site identity's daily `max_token_budget`, the monthly cost cap, and the cost-per-qualified-handoff ceiling | `site-spend-ceiling` | Phase 0 exit; Phase 3 GO | Phase 0 waits |
| D-4 | Gate's per-credential rate limit on the site identity, the `max_token_budget` window, and whether to add Redis to `flint-core` or accept Postgres-summed windows that are not instant across gate's two replicas | `site-spend-ceiling` | FR-36 | Phase 0 waits |
| D-5 | Retention period for site conversations (30 days or shorter) | `site-session-erasure` | FR-33, privacy notice | 30 days |
| D-6 | Alibaba Cloud DPA and SCCs in place, and the EU geo-policy (serve EU visitors, or restrict) | `site-retention-and-privacy` | Privacy notice; Phase 0 exit | Phase 0 waits |
| D-7 | Whether `runtime.know-me.tools` is needed at all. If not, delete it; if so, put it behind a fail-closed gate policy | `uar-runtime-host-lockdown` | First deploy | Delete it |
| D-8 | A data-request contact for the privacy notice; separately, whether the site publishes a general contact method | Phase 0 exit (data-request contact); none (general contact) | Privacy notice and Phase 0 exit; contact in the spine and as a handoff destination | Data-request contact: Phase 0 waits. General contact: none, and the agent says there is none |
| D-9 | Pricing statement | none | Pricing answers | "Not published yet" |
| D-10 | Whether and how to assign experiment arms: any device storage (`localStorage` or `sessionStorage`) is under ePrivacy Art. 5(3); server-side assignment must not reuse the binding cookie | `site-experiment-assignment` | Phase 3 | No bucket until counsel decides |
| D-11 | Graduate the widget sandbox to a public default or to an experiment arm, on the Phase 2 exit evidence | After Phase 2 exit | Widget arm in Phase 3 | Widgets stay in the sandbox |
| D-12 | Approve filing the upstream UAR changes (catalog components; a session delete and persisted-session TTL; dropping `activate_skill` when skills are `none`) and accept that their timeline is not ours | Phase 0 week one (session delete, `activate_skill`); Phase 2 start (catalog) | FR-20; Phase 2 | Raise them; Phase 0 does not wait on them |
| D-13 | Maximum wait for the upstream catalog change before Phase 2 stops | Phase 2 start | Phase 2 fallback | Six weeks from filing |
| D-14 | Resume the agent after a brand incident, on a postmortem showing an enforcement-layer fix | After any incident | Kill criterion 2 | The agent stays off |
| D-15 | Which tools the public site agent may use (initial allowlist); each needs a §6.2 T2 review entry | `site-agent-tool-allowlist` | FR-11 | None until approved; `presentation_render` proposed for the sandbox and `a2ui_render` a separate candidate; approval stays `deny` until the `activate_skill` precondition holds |
| D-16 | The incident on-call owner who can turn the kill switch on the same day, and how they are reached | Phase 0 exit | Phase 0 exit; kill criterion 2 | Phase 0 waits |
| D-17 | Counsel's confirmations: CCPA applicability, the Art. 50 provider reading and dates, the Singapore transfer basis, and the ePrivacy readings in §6.3 | Phase 1 exit | `apex-dns-cutover`; FR-40 | Cutover waits |
| D-18 | The gate budget values for the site identity, and who manages the site's gate credential: who sets and changes the budget values, and who issues, stores and rotates the credential | `gate-site-credentials` | FR-46, FR-36; Phase 0 exit | Phase 0 waits |
| D-19 | The gate policy for `sso-broker` (`sso.know-me.tools`): public for OAuth callbacks, or a Kratos session required | `cluster-extauthz-policies` rollout after Phase 0 | `sso-broker` policy | No gate policy on `sso-broker` |
| D-20 | flint-infra's `deploy.yaml` applies to the namespace Argo CD manages for gate (split brain): retire it, or scope it away from that namespace | `gate-ci-gitops` | A single deploy path for gate | The risk stays open and is tracked in `gate-ci-gitops` |

## The uncomfortable part

The cheapest outcome that serves visitors may be Phase 1 alone: good static pages and a cited chat. The evidence in §1.2 and §1.3 supports that design and does not support a conversation-first site, and it shows no measured lift for the agent layer either. Launching the concierge rests on demo value at low cost, not on expected conversion. Phases 2 and 3 cost more than Phases 0 and 1 together, Phase 2 waits on upstream changes we do not control, and Phase 3 may be infeasible at our traffic. They exist to test a theory that may lose. The plan only works if a HOLD or NO-GO is accepted when the data says so, and if one public misbehaviour stops the agent rather than being averaged into a monthly count.
