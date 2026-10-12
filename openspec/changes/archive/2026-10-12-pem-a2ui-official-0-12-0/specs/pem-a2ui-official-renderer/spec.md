## ADDED Requirements

### Requirement: a2ui-react pins official A2UI 0.12.0 exactly
`@prometheus-ags/a2ui-react` SHALL depend on `@a2ui/react` 0.12.0, `@a2ui/web_core` 0.12.0 and `@a2ui/markdown-it` 0.2.0 with no version ranges, and its typecheck and tests SHALL pass.

#### Scenario: Clean install
- **GIVEN** a scratch app installs the published version
- **WHEN** it typechecks and renders a v0.9.1 surface
- **THEN** no version of the three official packages other than the pins is installed

### Requirement: The release carries no unresolved workspace protocol
Every published `@prometheus-ags/*` manifest SHALL contain concrete versions, not `workspace:`.

#### Scenario: Packed manifest
- **GIVEN** `pnpm publish --dry-run` runs for a package
- **WHEN** its packed `package.json` is read
- **THEN** no dependency value starts with `workspace:`
