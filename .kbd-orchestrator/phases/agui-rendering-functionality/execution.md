# Execution: agui-rendering-functionality

Dispatched 2026-10-09. Backend: `openspec`, driven task by task through `/kbd-apply` (never bare `/opsx:apply`). KBD owns task state; the driver in this session owns begin/end.

## Operator confirmations (2026-10-09, before execute)
- PEM version is **4.2.0**.
- Public agent tool list (D-15, D-36): `presentation_render` only; `a2ui_render` stays denied.
- PEM publication is **required**: dry run and packed-manifest report first (D-34), then publish at CP2. The publish is not optional and must be confirmed done before the phase closes.

## Plan references
- Plan and Task model assignments: `plan.md` (70 rows, keyed by phase path, change ID, backend task ID).
- Round order: R1 `register-pem-workspace`, `agui-public-artifact-allowlist`; R2 `pem-a2ui-official-0-12-0`, `agui-render-registry`; R3 `app-a2ui-surface-renderer`; R4 `agui-inferred-a2ui`, `site-proxy-a2ui-optin`; R5 `site-agent-a2ui-policy`; R6 `uar-a2ui-validator-parity` (conditional); R7 `agui-a2ui-live-verification`.
- Checkpoints: CP1 leak-fix deploy; CP2 PEM merge, dry-run report, publish; CP3 Train B merged with `[skip ci]`, one `workflow_dispatch` deploy, A2UI switch on after the red team.

## Dispatch identity
Route: native, in-session driver (Claude Code, claude-sonnet-5-5) for mechanical tasks; Agent tool workers for tasks the table assigns to opus or to role agents. Any deviation from a table row is recorded here before it runs.

## Lessons carried from prior context
- First-deploy gotchas: the CI deployer is namespace-scoped; images must be public; `args:` not `command:` in Kubernetes.
- No unrequested deploys. PR titles that need no deploy carry `[skip ci]`. The operator merges every PR and approves every deploy.
- Chat stays on; the kill switch and `SITE_CHAT_KILL_SWITCH_EXPECTED` are not touched.

## Gates
No per-task or per-change QA. After all production changes: one production-path integration gate (change 10) and one cumulative `artifact-critic` and adversarial review. Execute stays active until verify and archive succeed for every change.

## Log
- Change 1 `register-pem-workspace`: in progress.
