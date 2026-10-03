## Why

The public site makes paid model calls for anonymous visitors. §9 put the ceiling at flint-gate, but under ext_authz gate never sees a run's usage (U18), so it cannot enforce a token budget. The enforcing cross-visitor ceiling is therefore a site-server meter that reserves before it forwards (amendment N15). FR-36 also requires a kill switch, `max_output_tokens` and alerts; FR-38 requires per-turn usage records.

## What Changes

The authoritative design and tests are in `openspec/changes/site-spend-ceiling/tasks.md`.
- **Reserve, then settle.** Before forwarding a turn, the site server reserves the per-turn reservation size against the daily and monthly token counters in one transaction, and refuses the turn if either would exceed its D-3 budget. On the run's `agui.done` (UAR `src/uar/api/sse.rs:690-709`) the reservation is settled to the actual `usage.total_tokens`. A run that never reports usage keeps its full reservation, so every run that reaches UAR is counted. Concurrent turns reserve before they run; overshoot is bounded by the recorded excess of runs that exceeded their reservation.
- **One dialect.** `site-proxy-hardening` pins `stream: true`, `stream_mode: "dual"`. Settlement parses only `agui.done`.
- **Store.** SurrealDB `ns=site` / `db=meter`, separate from UAR's `ns=uar` / `db=uar`, reached through a user defined `ON DATABASE` for `site/meter` only, created out of band by the operator with root before the first deploy. CI never holds root. Daily and monthly counters are rows per UTC period, created on first use, reserved in one transaction that is cancelled (`THROW`) if either conditional update matches no row.
- **Fail closed.** If the meter store is unreachable, new turns are refused with the offline state.
- **Alerts (FR-36).** At 80% of the daily budget and at exhaustion, through the same channel as the provider-side spend alert.
- **Monthly cap (D-3).** A monthly token budget on the same meter, plus the provider-side spend alert. No USD limits (`max_cost_per_session_usd`, `llm.budget.global_limit`) until the model is priced: both fail admission for an unpriced model (`cost_budget.rs:336-345`; `manager.rs:1553-1559`).
- **Per-conversation bound.** UAR `max_tokens_per_session` limits one conversation's length; it is not a per-visitor layer, because the visitor chooses the session through `thread_id`.
- Kept from §9: the per-IP limiter as the first layer, title requests on the same site token, `max_output_tokens` in UAR settings, a kill switch read from a mounted ConfigMap file, a provider-side spend alert, and FR-38 per-turn usage records. Feeding the meter to gate's `max_token_budget` is optional and decided by D-4.
- Lands in: this repo (`server/`, `k8s/`, UAR settings) and the operator's SurrealDB. Owner: km-devops-engineer (meter user, ConfigMap, UAR settings, alerts); km-rust-engineer (meter in the site server); km-security-officer reviews.
- Depends on: `site-proxy-hardening`, `gate-site-credentials`, D-3, D-4.
- Plan: `.kbd-orchestrator/phases/uar-integration/plan.md` (revision 3); amendment N15 in `.kbd-orchestrator/phases/uar-integration/children/uar-capability-assessment/plan.md` (table A2).

## Impact

- Capability: `site-spend-ceiling`.
- Closes §6.4 item 4 with `gate-site-credentials`. FR-36, FR-38. `site-chat-offline-states` renders the refusal.
- New dependency of `knowme-web` on SurrealDB (NetworkPolicy and Secret reference in `k8s-stack-manifests`).
