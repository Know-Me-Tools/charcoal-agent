# 10. Unresolved review findings

The document went through two adversarial review rounds, recorded in [review/round-1.md](../review/round-1.md) and [review/round-2.md](../review/round-2.md). Two rounds is the limit, so every finding still open after the final revision is listed here and none is silently dropped. Each one has an owner or a decision that settles it.

## Needs a code or platform change outside this repository

| # | Finding | Why it is open | Owner / decision |
|---|---|---|---|
| U1 | **UAR always offers `activate_skill`.** The tool projection exempts built-in model-control tools from tool selection, so the model is offered it even when the allowlist is empty (§4.7). `tool_approval: deny` is the only lock. | Approval cannot move to `auto` until UAR drops `activate_skill` when `skills.mode == none`, or a test proves an `activate_skill` call under `auto` is rejected without hanging. | UAR maintainers, D-12 |
| U2 | **UAR has no session delete and no session TTL.** Visitor text also lands in checkpoints and admission evidence (§4.5). | Phase 0 uses an operator-scheduled purge plus request-based erasure. A per-conversation delete (FR-20) needs a UAR change. | UAR maintainers, D-12 |
| U3 | **The knowledge-base chunker splits inside version numbers** ("v0.", "Obsidian 1."). The fragments rank highest and degrade answers (§4.8). | Either a UAR chunker change (minimum chunk size, version-aware sentence splitting) or a corpus-side workaround. | `kb-chunking-quality` |
| U4 | **flint-gate has no Envoy ext_authz endpoint** (§4.7). | Every SecurityPolicy, and so FR-47 and §6.4 item 18, depends on it. | `gate-ext-authz-endpoint` |
| U5 | **Gate route and key scoping.** An API key valid for one gate route may be accepted on another unless a Cedar authorize hook restricts it. | Not yet verified in gate source. | Platform; `gate-site-credentials` |
| U6 | **No Redis in `flint-core`.** Gate's windowed token budgets sum in Postgres, which is not instant across two gate replicas. It is also unknown whether the budget counts runs cancelled by a disconnect. | Affects how tight the spend ceiling is. | D-4 |
| U18 | **The spend ceiling can't see token usage.** Under ext_authz the site server calls UAR directly inside the cluster, so gate never sees a run's tokens. It is unclear how gate's `max_token_budget` would learn usage, and the per-credential rate limit may count token requests rather than chat turns (§4.8, T1, FR-36). | A usage feed from UAR to gate, UAR's own agent-scope budget, or a per-turn counter in the site server. `site-spend-ceiling`, D-4 |
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
| U12 | **Qwen Token Plan terms appear to forbid application backends** [C13]. | D-2: pay-as-you-go key or written approval from Alibaba |
| U13 | **Legal readings are not confirmed:** EU AI Act Art. 50 timing, read on an unofficial mirror (confirm on EUR-Lex) [B25]; Singapore transfer adequacy; CCPA applicability; the Art. 50 provider reading. | D-17, counsel |
| U14 | **ePrivacy and the experiment bucket.** `sessionStorage` is still device storage. | D-10, counsel. Default: no bucket |
| U15 | **sso-broker gate policy** (public OAuth callbacks or auth required). | D-19 |
| U16 | **flint-infra still has a `deploy.yaml` that applies into the namespace Argo CD manages.** That is a split-brain risk. | D-20 |
| U19 | **The adopted gate manifest hard-codes the `deployment.kubernetes.io/revision` status annotation.** Every rollout leaves Argo `OutOfSync` (observed after the JWKS-fix deploy, revision 23 vs 24). | Remove the annotation in know-me-cluster |
| U17 | **Overlap between D-3, D-4 and D-18.** D-3 holds the budget numbers, D-4 the limiter and window, D-18 key custody and who changes budgets. | Operator to confirm the split |

## Evidence quality notes

- **§7.3 claims from a skill reference, not a source anyone read:** the 69% citation-versus-recommendation figure, the 40–60-word answer optimum and the FAQ-reliability line. They are labelled as such.
- **OpenAI's crawler page now lists four bots** (it adds OAI-AdsBot). §7.1 names three, which is accurate but incomplete.
- **The deep-research package ([R#]) is thin:** 10 sources, confidence 0.47, verification partial. No claim in this document rests on it alone.
