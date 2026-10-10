## 1. Client AG-UI render registry: events and artifact types map to renderers, hide or adapt

- [x] 1.1 Write characterization tests for the current event handling in `use-message-stream` and tool-name dispatch in `enhanced-thread`, so the refactor preserves behaviour.
- [ ] 1.2 Review flint-forge's `FlintRegistry`, `slugMap` and `FlintAgUiAdapter` as a design reference for the registry and record what is adopted or declined and why (it is not a renderer: unpublished on npm, own `a2ui:surface` dialect).
- [ ] 1.3 Define the registry types and API in `src/features/chat/render-registry/`: keys (`event`, `artifact`, `activity`), dispositions (`render`, `hide`, `adapt`), unknown-hides default.
- [ ] 1.4 Add the default entries from the event inventory: render, hide (diagnostics), adapt (A2UI carriers).
- [ ] 1.5 Route `use-message-stream.ts` through the registry; store actions unchanged.
- [ ] 1.6 Route the tool-name dispatch in `enhanced-thread.tsx` through the registry and remove the `if` chain.
- [ ] 1.7 Render the currently ignored events with existing blocks: `agui.cancelled` (showing usage when present: the pinned UAR build may not emit it yet, see `site-agent-a2ui-policy`), `agui.subagent.*`, `agui.rag_citations`, and a read-only `agui.tool_call.approval_required` indicator.
- [ ] 1.8 Hide internal artifacts at render time so artifacts already persisted in PGlite stop showing; test with a persisted `provider_event`.
- [ ] 1.9 Visual-first capture of the changed surfaces at 320 and 1440 in both themes; view and list the images.
- [ ] 1.10 Integration check: lint, typecheck, `npm test` and `npm run build` pass, and the original screenshot scenario (a turn that emits diagnostics) shows no diagnostic cards.

Model assignments for these tasks are in `.kbd-orchestrator/phases/agui-rendering-functionality/plan.md` under Task model assignments, keyed by phase path `agui-rendering-functionality`, change `agui-render-registry` and backend task ID (the ordinal of each task above).
