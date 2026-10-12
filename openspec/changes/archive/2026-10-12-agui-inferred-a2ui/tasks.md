## 1. Infer A2UI for events that have no registered template

- [x] 1.1 (the rules and caps are recorded in the header comment of `src/features/a2ui/infer.ts`; this change has no separate design document) Define the inference rules and caps (depth, size, escaping; only the nine components) and record them in the change design.
- [x] 1.2 Write golden tests first: structured artifact or event in, A2UI messages out, for `confirm`, `form`, `select`, `display` artifacts and `approval_required`.
- [x] 1.3 Implement inference for generic structured tool results (a card with rows) with fallback to hide when over a cap.
- [x] 1.4 Register the inferred shapes as `adapt` entries; explicit registrations take precedence.
- [x] 1.5 Visual capture at 320 and 1440 in both themes, and integration check: `npm test && npm run lint` and `npm run build` pass.

Model assignments for these tasks are in `.kbd-orchestrator/phases/agui-rendering-functionality/plan.md` under Task model assignments, keyed by phase path `agui-rendering-functionality`, change `agui-inferred-a2ui` and backend task ID (the ordinal of each task above).
