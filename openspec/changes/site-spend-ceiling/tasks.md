## 1. Reserve-and-settle meter, kill switch and usage records

**Staging (revision 3, final review):**
- **Before the first deploy:** tasks 1.1–1.10 and 1.13, with the local done-when (1.12) passing on the compose stack. The first deploy ships with the kill switch **on** (`github-deploy-workflows` 1.7).
- **After the first deploy:** for 1.14 the operator sets the daily and monthly budgets to a small **test budget** (a few turns' worth), then turns the switch off. Exposure during testing is then capped by the control under test, so no bypass is needed. After 1.14 passes, the budgets are raised to the D-3 values.

- [ ] 1.1 (operator, km-devops-engineer) Create the meter store out of band, with root, before the first deploy: namespace `site`, database `meter`, and a user defined `ON DATABASE` for `site/meter` only, with no rights in `ns=uar`. Put its credential in a Kubernetes Secret referenced by `k8s-stack-manifests`; CI never holds root or this credential's source.
- [ ] 1.2 Implement the reservation in the site server. Before forwarding a chat turn (titles included), reserve `n` against **both** the daily and the monthly counter in **one SurrealDB transaction** (`BEGIN … COMMIT`):
  - Each counter row is keyed by its UTC period, e.g. `meter:day_2026_10_02` and `meter:month_2026_10`.
  - Each row is created on first use with `UPSERT`.
  - Each row is updated only `WHERE total + n <= budget`.
  - SurrealQL does not fail an `UPDATE` that matches no row. So each update's result is checked inside the transaction, and an empty result triggers `THROW`, which cancels the whole transaction: neither counter is reserved. The turn is then refused with the offline state, with no upstream call.
  - The reservation records the period keys it used.
  - `n` is the reservation size from 1.8.
- [ ] 1.3 Implement settlement. Parse only the `agui.done` event of the pinned `dual` stream (UAR `src/uar/api/sse.rs:690-709`), and adjust both counters by `usage.total_tokens − n` in one transaction, **against the period rows recorded at reservation**. A turn that straddles a UTC day or month boundary settles to the period it was admitted in.
  - A run that ends without `agui.done` (disconnect, error, any unexpected path) keeps its full reservation.
  - **Actual usage can exceed the reservation.** UAR checks `max_tokens_per_turn` when each model call is admitted (`cost_budget.rs` `check_limits`), not during a call, so a multi-call run can pass it by up to one call. Settlement charges the excess in full. That can take a counter past its budget, which then refuses further turns.
  - Every settlement where actual > `n` fires the excess alert (1.6) and is recorded (1.10).
  - The overshoot of a budget is bounded by the sum, over in-flight turns, of their excess over `n`, and it is measured rather than assumed to be zero.
- [ ] 1.4 The monthly token budget (D-3) is enforced by the same transaction as the daily budget (1.2). Set no USD limit (`max_cost_per_session_usd`, `llm.budget.global_limit`) until the model's catalog price is checked; record this in the change.
- [ ] 1.5 Fail closed: if the meter store is unreachable or the reservation errors, refuse new turns with the offline state.
- [ ] 1.6 Alerts, all through the same channel as the provider-side spend alert:
  - a warning at 80% of the daily and of the monthly budget;
  - an alert at exhaustion;
  - an excess alert whenever a settlement exceeds its reservation (1.3).

  Also set up the provider-side spend alert.
- [ ] 1.7 Keep the site server's per-IP limiter as the first layer, ahead of the meter.
- [ ] 1.8 (km-devops-engineer) Set the site model's `max_output_tokens` in UAR settings (the agent policy has no `max_tokens` key). **Set `max_tokens_per_turn` in `uar/agents/knowme-site.json` `extensions.budgets`**: it is unset today, and UAR applies no per-turn limit when it is unset (`cost_budget.rs:292-306`). Then set the reservation size `n` = `max_tokens_per_turn` plus one model call's maximum (input context limit + `max_output_tokens`). Under UAR's admission-time check, that covers the largest turn. Document UAR `max_tokens_per_session` as a per-conversation bound, not a per-visitor limit.
- [ ] 1.9 Kill switch: a ConfigMap the **operator creates out of band** (not in `k8s/`, so the deploy workflow's `kubectl apply -k` never resets it), referenced by the `knowme-web` Deployment (`k8s-stack-manifests` 1.6). Its initial value is on. The site server reads it from the mounted file and returns the offline state on every replica within 60 seconds of a change, with no redeploy and no pod restart. An environment variable does not pass.
- [ ] 1.10 FR-38: for each completed or cancelled turn, record model, input tokens, output tokens, time to first token and outcome, with no session id and no message text.
- [ ] 1.11 Record the D-4 answer: whether the meter also feeds gate's `max_token_budget` (optional), and if so how gate learns a run's tokens and whether disconnect-cancelled runs count (§4.8).
- [ ] 1.12 Done-when, **local compose stack**. Run each test and paste its output here:
  - (1) A `stream: false` request and a `stream_mode: agui_spec` request are each metered.
  - (2) A run aborted by a client disconnect keeps its reservation.
  - (3) N concurrent turns at the budget boundary are admitted only while their reservations fit. For the excess fixture, a **test agent config** has a deliberately small `max_tokens_per_turn`, and a multi-call run (a KB-search turn) exceeds `n`. It is charged in full and fires the excess alert, and the overshoot equals the recorded excess.
  - (4) The total survives a `knowme-web` rollout, and two replicas share it.
  - (5) **Meter path broken while UAR stays healthy:** revoke the meter user's credential, or cut the `knowme-web` → SurrealDB connection only. Turns are refused, and UAR's request log shows **zero** chat calls during the test. Stopping SurrealDB does not count, because it also stops UAR.
  - (6) The 80%, exhaustion and excess alerts fire.
  - (7) The first turn after a UTC day boundary (and a month boundary) creates the new counter row and is admitted.
- [ ] 1.13 Rollover: counter rows are keyed by UTC period and created on first use (1.2). The previous period's row is kept for the FR-38 record and not reused. Covered by test (7). (Added in revision 3.)
- [ ] 1.14 Deployed done-when (last task; runs after the first deploy). The operator sets the test budget, turns the kill switch off and re-runs **all** tests (1)–(7) against the deployed stack. Test (5) breaks only the meter path, by revoking the meter credential, which fails closed. Paste the output, restore the credential, then raise the budgets to the D-3 values. (Added in revision 3.)
