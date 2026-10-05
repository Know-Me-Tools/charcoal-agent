# Decision log — uar-integration

Append-only. Dated entries. Mark superseded entries; do not delete them. The D-1 to D-20 definitions live in `docs/agent-led-site/sections/09-implementation-plan.md`, "Operator decisions". This log records operator answers and decisions added after that table.

## 2026-10-02 · operator answers after the uar-capability-assessment child phase

Source: the child phase's `assessment.md` and `plan.md` (`.kbd-orchestrator/phases/uar-integration/children/uar-capability-assessment/`).

### D-2 · Qwen Token Plan — risk accepted by the operator
- **Decision:** keep the Qwen Token Plan for the site's chat model (`qwen3.8-max`).
- **Operator's words:** "we are in the 'operator' model where the token plan is being used to assist the owner of the plan, who is the client."
- **Status:** a risk accepted by the operator. It does **not** close U12. Neither of §9's two exits was taken: written approval from Alibaba, or a capped pay-as-you-go key. U12 stays open in §10 with this rationale and the [C13] reference. Kill criterion 1 and the provider-side spend alert keep their dependency on it.

### D-21 · Adopt §9 Phase 0 into this phase
- **Decision:** `uar-integration` becomes the paper's Phase 0 ("safe to deploy, not public"). The 24 new §9 changes are added, with the amendments in the child plan (A1, A2).
- **Consequence:** `apex-dns-cutover` is cancelled in this phase and moves to Phase 1, as §9 says. Its OpenSpec change stays in place.
- **Operator's words:** "Adopt in this phase."

### D-22 · Site grounding: retrieval with document-level chunks
- **Decision:** the site KB is created with `chunk_strategy: "document"`, which UAR accepts per KB (`KbConfigRequest`, `src/uar/api/knowledge.rs:61-68`).
- **Implemented by:** `kb-chunking-quality`. Its seed-script change and `--recreate-kb` flag are in that change.
- **Not adopted:** full-context grounding, because the site should run KnowMe's own retrieval.
- **Upstream:** the UAR default-chunker fix goes to the UAR roadmap.
- **Operator's words:** "do as you recommend" (assessment F4).

### D-23 · Research method deviation accepted
- **Decision:** the external landscape research (`research/landscape.md`, 74 sources, Firecrawl) replaces the stalled deep-research package, which had 0 sources and a 10-source daemon cap.
- **Operator's words:** "Yes. accept."

## 2026-10-03 · operator answers at the start of revision 3 execution

| # | Decision | Source |
|---|---|---|
| D-3 | Site meter budgets: **1,000,000 tokens per UTC day, 20,000,000 tokens per UTC month** (about 400 turns a day at 1.5–3k tokens a turn). The monthly budget stands in for a cost cap until the model is priced. | Operator chose "1M/day, 20M/month (Recommended)". |
| D-7 | **Delete `runtime.know-me.tools`.** Only `knowme-web` and flint-gate reach UAR, in-cluster. | Operator chose "Delete it (Recommended)". |
| D-12 | **File the six UAR roadmap issues** from `children/uar-capability-assessment/uar-roadmap.md`. Phase 0 does not wait on them. | Operator chose "Yes, file them (Recommended)". |
| D-18 | **The operator holds custody of the site's gate credential.** They issue it in gate, store it only in the Kubernetes Secret `site-proxy` (created out of band) and rotate it every 90 days and on any incident. | Operator chose "You, quarterly (Recommended)". |

Applied as the paper's defaults, pending operator objection:
- **D-4:** the meter does not feed gate's `max_token_budget`.
- **D-5:** 30-day retention.
- **D-20:** flint-infra `deploy.yaml` stays an open, tracked risk in `gate-ci-gitops`.

Still open for Phase 0 exit: D-6, D-8, D-16.

### D-22 correction · 2026-10-04 · KB config alone does not set chunking
D-22 assumed chunking is set by KB config with no UAR code change. Live check on the local stack: the KB stored `chunk_strategy: "Document"`, but ingestion still cut chunks at "v0." and "Obsidian 1." because UAR chunks with a service-wide semantic chunker (`src/server.rs:814`). Operator chose to fix UAR (Prometheus-AGS/universal-agent-runtime#345). `kb-chunking-quality` 1.5 (larger `chunk_size`) cannot work on this path and is superseded. `site-agent-seed` 1.3 and `kb-chunking-quality` 1.7 wait on that PR merging, a new image digest, and a repin here.

### D-22 revision · 2026-10-04 · section-sized chunks, per-KB retrieval threshold
Operator chose option A after the live gate: the site KB uses `recursive` chunks of 1000 characters (not one chunk per document, which scored 0.66 for the right document). The FR-8 checks now search with an explicit low `min_score` and pass when, among the top 5 results, each full version string is intact, no chunk ends on a bare version fragment, and a chunk from `the-boss.md` names both Windows and macOS. Operator also chose a UAR change for the chat threshold (#353, per-KB `retrieval_min_score`/`retrieval_top_k`); the seed script sets 0.5 and 5 once an image with it is pinned. Evidence: FR-8 passes (exit 0); live chat turns on the pre-#353 image answered the unshipped-feature question correctly and failed the platforms question.

### D-24 · 2026-10-05 · DNS cut over before chat go-live; SurrealDB on ephemeral storage
- **DNS.** The operator moved the Cloudflare A records for `know-me.tools` and `www` to the gateway (`23.239.29.33`) on 2026-10-05, before anything was deployed behind it, so the site was down until the first deploy finished. D-21 had placed `apex-dns-cutover` last in Phase 1. Its tasks are not done as written: no page-parity checklist (1.1) was made, and "the chat works in production" (1.3) is false because the chat is off. The cutover itself (1.2) is done, by the operator, with the chat kill switch on.
- **First deploy.** It was blocked in order by: the bootstrap script never having run; the cluster gate being an old build without `/oauth/token` (know-me-cluster PRs #3, #4, #5); the `knowme-web` package being private; a Namespace object in the deployed manifests; and an unprovisionable SurrealDB volume. Details are in `.prometheus/gotchas.md`.
- **Storage.** Linode refused to create SurrealDB's volume (`[400] You've reached a limit for the number of active services on your account`) while the Quotas page showed 7 of 250 volumes; the cause is unresolved (a per-region `us-central` quota or an account-level service limit). The operator chose to run SurrealDB on the node's own disk (`emptyDir`, PR #13) for now. A pod restart loses its data: UAR sessions, the knowledge base (the seed re-creates it), the spend meter's counters, and the meter's namespace, database and user (`bootstrap-site.sh meter-user` re-creates those).
- **Consequence.** The chat must stay off until SurrealDB is back on a real volume and `site-spend-ceiling` 1.14 has passed. Rationale for accepting this: it got the site serving at once with nothing exposed, and it is reversible by restoring the volume claim template, which is kept as a comment in `k8s/base/surrealdb-statefulset.yaml`.
- **Also.** UAR takes 50 to 95 seconds to start and its liveness probe alone allowed about 75; PR #15 added a startup probe. `ci-secrets-out` 1.4 is ticked but the `production` environment has no required reviewers; that is open under 1.6.
