## 1. Render A2UI surfaces in the app with PEM a2ui-react and a shadcn catalog

- [ ] 1.1 Add `@prometheus-ags/a2ui-react` (version from the PEM release) with exact pins, plus its `@ag-ui/core` peer (this repo does not have it; pin an exact version inside the peer range), and confirm the lockfile has one version of each official A2UI package and no ranges for them.
- [ ] 1.2 Bump `@prometheus-ags/entity-graph-core` and the `@prometheus-ags/prometheus-entity-management` alias from 4.0.2 to the same new version as `a2ui-react` (its peer is lockstep), and run an entity-graph regression check covering lists, garbage collection (4.1.0 treats list membership as a reference) and mutations.
- [ ] 1.3 Write the carrier adapter in this repo, as decided by the carrier spike in `pem-a2ui-official-0-12-0`, feeding PEM's public processor API, with tests for malformed and oversized input.
- [ ] 1.4 Add a lazy-loaded `A2uiSurfaceBlock` and register it in the render registry in place of `A2uiDisplayBlock`; keep the Mermaid path.
- [ ] 1.5 Implement the nine components with shadcn and Base UI under the flat 2.0 tokens (no borders, shadows or gradients), keyboard and reduced-motion safe.
- [ ] 1.6 Wire the default-deny action policy; surfaces are render-only, and a Button with an action renders disabled. Record the decision.
- [ ] 1.7 Measure the bundle against the app budget (under 300 kB gzipped JS for an app page) and keep A2UI in a separate lazy chunk; record numbers, including the cost of the Lit-backed custom elements.
- [ ] 1.8 Visual-first capture at 320 and 1440 in both themes, plus keyboard and reduced-motion checks; view and list the images.
- [ ] 1.9 Integration check: `npm test && npm run lint` and `npm run build` pass, and a fixture stream containing an `a2ui` artifact renders a surface in a real browser (Playwright).

Model assignments for these tasks are in `.kbd-orchestrator/phases/agui-rendering-functionality/plan.md` under Task model assignments, keyed by phase path `agui-rendering-functionality`, change `app-a2ui-surface-renderer` and backend task ID (the ordinal of each task above).
