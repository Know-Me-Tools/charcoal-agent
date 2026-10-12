## Why

Unit and per-edit tests are not completion evidence. The phase is done when the production path shows the behaviour.

## What Changes

- A Playwright test of a real local turn producing an A2UI surface, diagnostics hidden, cancelled state shown.
- A live public capture and live visual captures, with a README, in a dated evidence folder.
- A cumulative diff-mode adversarial review of the phase's changes.
- Lands in: this repo (`docs/qa/`, evidence folders). Owner: km-qa-engineer; km-security-officer.
- Depends on: all earlier changes (change 9 may have closed with no code).
- Plan: `.kbd-orchestrator/phases/agui-rendering-functionality/plan.md` (round order and the Task model assignments for this change).

## Impact

- Capability: `agui-a2ui-verification`.
- Needs Train B deployed and approved by the operator.
- Decisions: see `.kbd-orchestrator/phases/agui-rendering-functionality/decision-log.md` (D-25 to D-31).
