## Why

UAR has no session delete, no persisted-session TTL and no read route for the tables that hold visitor-linked data (§4.5). That data sits in `sessions`, `checkpoints`, `cost_ledger` and `tool_admission_evidence`, plus `memory` if it is ever enabled. FR-33 requires retention and request-based erasure without waiting on a UAR change.

## What Changes

- An operator-scheduled purge of those stores for the `knowme-site` owner past the retention period (D-5; 30 days unless the operator sets a shorter one).
- A published, request-based erasure process for a named session.
- A direct SurrealDB test per store for a purged and an erased test session.
- The UAR change for a session delete and a persisted-session TTL (D-12) is filed separately. FR-20's delete control waits on it and is not a Phase 0 gate.
- Lands in: this repo (`k8s/`, `scripts/`, `docs/`) and a UAR issue. Owner: km-devops-engineer (purge); km-security-officer (process); km-rust-engineer (UAR change).
- Depends on: `site-chat-proxy`, D-5.
- Plan: `.kbd-orchestrator/phases/uar-integration/plan.md` (revision 3).

## Impact

- Capability: `site-session-erasure`.
- Closes §6.4 item 9. FR-33. Feeds `site-retention-and-privacy`.
