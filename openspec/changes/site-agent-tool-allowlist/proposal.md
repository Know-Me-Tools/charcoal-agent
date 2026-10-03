## Why

The launch run policy is in `uar/agents/knowme-site.json` and was seeded locally on 2026-10-01: tools `selected` with no ids, skills and MCP servers `none`, `tool_approval: deny` (§4.7). It is not committed, not deployed and not proven. UAR still offers the model `activate_skill` on every run, so `deny` is the only lock on it (§6.2 T2), and a misspelled policy key is dropped silently. The artifact text is not evidence; only the run's `effective_run_policy` and `turn_manifest` are (FR-11). Memory capture must also be off for every public turn (FR-41).

## What Changes

- Commit, deploy and prove the launch run policy through the FR-11 policy-and-manifest test.
- The site server injects `memory_enabled: false` into every forwarded chat turn (FR-41).
- The `activate_skill` review entry is filed in §6.2 T2.
- A tool-eliciting prompt set with a forced-call fixture on `activate_skill` that must yield `agui.tool_call.denied`.
- The input guardrail stays detect-only for Phase 0 (assessment F5): `UAR_GUARDRAILS__INPUT_SCREENING_ENABLED` stays on and flagged inputs are logged.
- Input tokens are re-measured on the deployed agent and recorded against the local figures.
- Lands in: this repo (`uar/agents/knowme-site.json`, `server/`, tests, `docs/agent-led-site/`). Owner: km-rust-engineer; km-conversational-designer (prompt set); km-security-officer reviews.
- Depends on: `site-agent-seed`, `site-proxy-artifact-filter`.
- Plan: `.kbd-orchestrator/phases/uar-integration/plan.md` (revision 3); amendment N10 in `.kbd-orchestrator/phases/uar-integration/children/uar-capability-assessment/plan.md` (table A2).

## Impact

- Capability: `site-agent-tool-allowlist`.
- Closes §6.4 item 5. FR-11 (policy and manifest test, `activate_skill` fixture) and FR-41.
