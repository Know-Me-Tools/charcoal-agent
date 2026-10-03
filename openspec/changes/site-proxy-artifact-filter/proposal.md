## Why

UAR emits `agui.artifact` events with `artifact_type` `effective_run_policy` and `turn_manifest` on every run. They expose the agent's internal policy and tool set to any visitor (§6.2 T15). FR-45 requires they never reach the client, while FR-11 still needs to read them to prove the launch policy.

## What Changes

- The site server drops `agui.artifact` events whose `artifact_type` is `effective_run_policy` or `turn_manifest` on the public path, and forwards every other event unchanged and unbuffered.
- A test harness hook that sees the upstream stream before the filter, for the FR-11 test in `site-agent-tool-allowlist`.
- Lands in: this repo (`server/`). Owner: km-rust-engineer; km-security-officer reviews.
- Depends on: `site-chat-proxy`.
- Plan: `.kbd-orchestrator/phases/uar-integration/plan.md` (revision 3).

## Impact

- Capability: `site-proxy-artifact-filter`.
- Closes the "internal artifacts dropped" part of §6.4 item 11. FR-45.
