# Goals

- Add AG-UI rendering functionality first: a registry that maps each AG-UI event and artifact type to a renderer component, so an A2UI component can be assigned to render a given AG-UI event and produce the display we want.
- Leverage prometheus-entity-management, which has A2UI-based components, and the flint-forge libraries, which have them too.
- Support the latest version of A2UI.
- Use the assessment phase, with support from adversarial review, to determine the best way to do this today, without CopilotKit, which binds us to their services.

## Operator amendments, 2026-10-09
- Update the PEM A2UI code (`/Users/gqadonis/Projects/prometheus/prometheus-entity-management`, package `@prometheus-ags/a2ui-react`) to the latest official A2UI **0.12.0** and **pin** that exact version in whatever we build. PEM is ours: change it freely and release a new npm version if needed to get the best result.
- Complete the UAR integration first, because UAR holds the A2UI registry that our component definitions must go into.

## Operator decisions on the assessment, 2026-10-09 (D-25 to D-31)
- Do the A2UI critical path of the UAR integration first; the rest of the 36 changes afterwards.
- Everything renders A2UI where appropriate and where it is registered or can be inferred (app and public agent).
- UAR may be changed to open its validator (one PR per change, on recorded need).
- The operator publishes PEM; make the needed changes there and publish with an updated version number.
- Fix the live internal-artifact leak inside this phase.
- Register `prometheus-entity-management` as a writable workspace folder.
