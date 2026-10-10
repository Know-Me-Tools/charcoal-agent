## Why

UAR serves A2UI only when asked (assessment F4), and the public path strips the request fields. Enabling A2UI on the public site is a deliberate server-side decision and must not be controllable by a visitor.

## What Changes

- `server/src/domain/chat_request.rs` always sets `presentation_mode`: `"text"` while the out-of-band switch is OFF, absent or unreadable, and `"a2ui"` plus `client_rendering.a2ui_profiles = ["uar.a2ui/1"]` only while it is ON, ignoring visitor-supplied values.
- A `site-a2ui-optin` ConfigMap mounted as an optional volume in `k8s/base/knowme-web-deployment.yaml` (absent means OFF), an optional file variable in the compose stack, and an `a2ui on|off` command in `scripts/ops/bootstrap-site.sh` that creates the ConfigMap OFF and flips it.
- A route test that `/api/uar/runs/{id}/a2ui/messages` and `/a2ui/actions` are not reachable through the public listener.
- Lands in: this repo (`server/`). Owner: km-rust-engineer; km-security-officer reviews.
- Depends on: agui-public-artifact-allowlist, app-a2ui-surface-renderer.
- Plan: `.kbd-orchestrator/phases/agui-rendering-functionality/plan.md` (round order and the Task model assignments for this change).

## Impact

- Capability: `site-a2ui-optin`.
- Does nothing visible while the switch is OFF, which is the default, whatever the agent policy says (`site-agent-a2ui-policy`).
- Production deploy needed (Train B); the operator flips the switch at CP3.
- Decisions: see `.kbd-orchestrator/phases/agui-rendering-functionality/decision-log.md` (D-25 to D-31).
