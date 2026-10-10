## Why

The operator wants the public agent to render A2UI (D-26). It is also the riskiest surface: an agent steered by an injected prompt could draw a deceptive control. A public go-live needs evidence, not intent.

## What Changes

- `uar/agents/knowme-site.json`: allow only `presentation_render`; leave `a2ui_render`, `activate_skill` and all else denied; reference the seeded presentation template.
- `scripts/seed-site-agent.sh` persists the template under the site identity.
- Token-cost measurement with A2UI on and off, and a red-team subset for deceptive UI.
- Lands in: this repo (`uar/agents/`, `scripts/`). Owner: km-security-officer; km-conversational-designer; km-devops-engineer.
- Depends on: site-proxy-a2ui-optin.
- Plan: `.kbd-orchestrator/phases/agui-rendering-functionality/plan.md` (round order and the Task model assignments for this change).

## Impact

- Capability: `site-agent-a2ui`.
- Overlaps `site-agent-tool-allowlist` (tasks 1.2, 1.5, 1.6); those tasks are completed here for the A2UI part and referenced from there.
- Production deploy and seed needed (Train B); the PR is merged only after the local red team passes, and A2UI stays off for visitors until the operator flips the opt-in switch at CP3.
- Decisions: see `.kbd-orchestrator/phases/agui-rendering-functionality/decision-log.md` (D-25 to D-31).
