# agui-a2ui-verification Specification

## Purpose
TBD - created by archiving change agui-a2ui-live-verification. Update Purpose after archive.

## Requirements

### Requirement: The production path shows A2UI rendering and no leak
On the deployed site, a turn that renders a surface SHALL show it as components, and a live capture SHALL contain no diagnostic artifact types.

#### Scenario: Live turn
- **GIVEN** Train B is deployed and A2UI is enabled for the public agent
- **WHEN** a visitor turn is made
- **THEN** an A2UI surface renders and the capture has no `provider_event` or `attempt_manifest`
