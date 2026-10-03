# 10. Unresolved review findings

The document went through two adversarial review rounds, recorded in [review/round-1.md](../review/round-1.md) and [review/round-2.md](../review/round-2.md). Two rounds is the limit, so every finding still open after the final revision is listed here and none is silently dropped. Each one has an owner or a decision that settles it.

## Needs a code or platform change outside this repository

| # | Finding | Why it is open | Owner / decision |
|---|---|---|---|
| U1 | **UAR always offers `activate_skill`.** The tool projection exempts built-in model-control tools from tool selection, so the model is offered it even when the allowlist is empty (§4.7). `tool_approval: deny` is the only lock. | Approval cannot move to `auto` until UAR drops `activate_skill` when `skills.mode == none`, or a test proves an `activate_skill` call under `auto` is rejected without hanging. | UAR maintainers, D-12 |
| U2 | **UAR has no session delete and no session TTL.** Visitor text also lands in checkpoints and admission evidence (§4.5). | Phase 0 uses an operator-scheduled purge plus request-based erasure. A per-conversation delete (FR-20) needs a UAR change. | UAR maintainers, D-12 |
| U3 | **The knowledge-base chunker splits inside version numbers** ("v0.", "Obsidian 1."). The fragments rank highest and degrade answers (§4.8). | Revised 2026-10-02: a config path exists. D-22 creates the site KB with `chunk_strategy: "document"` (UAR `KbConfigRequest`, `src/uar/api/knowledge.rs:61-68`), through the seed script and a `--recreate-kb` flag. It stays open until the FR-8 chunk checks pass, locally in `kb-chunking-quality` and deployed in `site-agent-seed` 1.6. The UAR default-chunker fix goes to the UAR roadmap. | `kb-chunking-quality`, D-22 |
| U4 | **flint-gate has no Envoy ext_authz endpoint** (§4.7). | Every SecurityPolicy, and so FR-47 and §6.4 item 18, depends on it. | `gate-ext-authz-endpoint` |
| U5 | **Gate route and key scoping.** An API key valid for one gate route may be accepted on another unless a Cedar authorize hook restricts it. | Not yet verified in gate source. | Platform; `gate-site-credentials` |
| U6 | **No Redis in `flint-core`.** Gate's windowed token budgets sum in Postgres, which is not instant across two gate replicas. It is also unknown whether the budget counts runs cancelled by a disconnect. | Revised 2026-10-02: it no longer affects the spend ceiling, which is the site server's meter (U18). It matters only if D-4 feeds the meter to gate's budget. | D-4 |
| U18 | **The spend ceiling can't see token usage at gate.** Under ext_authz the site server calls UAR directly inside the cluster, so gate never sees a run's tokens (§4.8, T1, FR-36). | Revised 2026-10-02: the mechanism is chosen. The site server, which sees `agui.done`, reserves `max_tokens_per_turn` before forwarding each turn and settles to the actual `usage.total_tokens`; an unreported run keeps its full reservation. The total lives in SurrealDB `site/meter`, and the meter fails closed. Feeding it to gate is optional (D-4). It stays open until `site-spend-ceiling`'s done-when tests (1)–(6) pass on the deployed stack; the design has not been re-reviewed. | `site-spend-ceiling`, D-4 |
| U7 | **No stack component issues per-visitor guest identities.** Phase 0/1 run every visitor under one `knowme-site` principal with HMAC session binding. | The minted `sub` must stay the knowledge-base owner, or retrieval returns nothing. | Phase 2 spike `visitor-identity-via-gate` |

## Needs evidence that only a deployed run can give

| # | Finding | How it closes |
|---|---|---|
| U8 | **`activate_skill` exposure and the `deny` lock are traced from source only.** No deployed run's `turn_manifest` or `effective_run_policy` has been read. | FR-11 run against the deployed agent through the proxy test harness |
| U9 | **The live ES256 path is unverified end to end.** The gate JWKS fix is deployed and publishes standard EC keys (checked 2026-10-01), but nothing has yet tested a gate-minted token verified by UAR. | FR-46 check once the UAR image containing #321 and `gate-site-credentials` are deployed |
| U10 | **The client IP behind Envoy is unverified.** Rate limiting depends on Envoy passing the visitor IP (`TRUSTED_PROXY_HOPS`). | Read the resolved IP from logs after the first deploy |
| U11 | **Exposure window before the controls land.** Before the Phase 1 cutover the cluster site can still be reached by sending the right Host header to the gateway IP. | Ordering rule: do not seed `knowme-site` on the cluster until the Phase 0 proxy controls are deployed (operator to confirm) |

## Needs counsel or an operator decision

| # | Finding | Decision |
|---|---|---|
| U12 | **Qwen Token Plan terms appear to forbid application backends** [C13]. | D-2, recorded 2026-10-02 as a risk accepted by the operator, not a closure. The operator keeps the Token Plan under the "operator model": "we are in the 'operator' model where the token plan is being used to assist the owner of the plan, who is the client." Neither exit (a pay-as-you-go key or written approval from Alibaba) was taken, so U12 stays open. Kill criterion 1 and the provider-side spend alert still depend on it. |
| U13 | **Legal readings are not confirmed:** EU AI Act Art. 50 timing, read on an unofficial mirror (confirm on EUR-Lex) [B25]; Singapore transfer adequacy; CCPA applicability; the Art. 50 provider reading. | D-17, counsel |
| U14 | **ePrivacy and the experiment bucket.** `sessionStorage` is still device storage. | D-10, counsel. Default: no bucket |
| U15 | **sso-broker gate policy** (public OAuth callbacks or auth required). | D-19 |
| U16 | **flint-infra still has a `deploy.yaml` that applies into the namespace Argo CD manages.** That is a split-brain risk. | D-20 |
| U19 | **The adopted gate manifest hard-codes the `deployment.kubernetes.io/revision` status annotation.** Every rollout leaves Argo `OutOfSync` (observed after the JWKS-fix deploy, revision 23 vs 24). | Remove the annotation in know-me-cluster |
| U17 | **Overlap between D-3, D-4 and D-18 (revised 2026-10-02).** D-3 holds the daily and monthly token budgets for the site-server meter. D-4 decides whether to feed the meter to gate; the store is decided (SurrealDB `site/meter`). D-18 holds gate credential custody. | Operator to confirm the revised split |

## Evidence quality notes

- **§7.3 claims from a skill reference, not a source anyone read:** the 69% citation-versus-recommendation figure, the 40–60-word answer optimum and the FAQ-reliability line. They are labelled as such.
- **OpenAI's crawler page now lists four bots** (it adds OAI-AdsBot). §7.1 names three, which is accurate but incomplete.
- **The deep-research package ([R#]) is thin:** 10 sources, confidence 0.47, verification partial. No claim in this document rests on it alone.
