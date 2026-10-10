## 1. Phase gate: end-to-end A2UI rendering, live leak check, cumulative review

- [ ] 1.1 Playwright test on the local compose stack: a real turn produces an A2UI surface that renders as components, diagnostics are hidden, and a cancelled run shows its state.
- [ ] 1.2 Live public capture (types only) and a visitor turn on the deployed site; save under a new dated evidence folder with a README, never over an earlier folder. Pass conditions: zero event names or artifact types outside the allowlist; and if A2UI is on, at least one `a2ui` artifact or `/a2ui/` patch is present.
- [ ] 1.3 Live visual capture of the deployed site at 320 and 1440 in both themes; view and list the images. Pass condition: if A2UI is on, a surface renders as components (not code or text) in the captures; otherwise record that A2UI is off and why.
- [ ] 1.4 Cumulative diff-mode adversarial review of the phase's changes; carry CRITICAL findings back as blockers.
- [ ] 1.5 Record the operator-only boundary actions that happened (merges, PEM publish, Train A and B approvals) and close the change evidence.

Model assignments for these tasks are in `.kbd-orchestrator/phases/agui-rendering-functionality/plan.md` under Task model assignments, keyed by phase path `agui-rendering-functionality`, change `agui-a2ui-live-verification` and backend task ID (the ordinal of each task above).
