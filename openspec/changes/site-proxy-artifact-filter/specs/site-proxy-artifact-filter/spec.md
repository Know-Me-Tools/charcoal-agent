## ADDED Requirements

### Requirement: Internal artifacts stay internal
> Superseded 2026-10-09 by change `agui-public-artifact-allowlist` (D-29): the denylist below leaked `provider_event` and `attempt_manifest`. The public stream is now an allowlist; this requirement remains true but is no longer sufficient.

The site server SHALL drop every `agui.artifact` event whose `artifact_type` is `effective_run_policy` or `turn_manifest` from the public stream, and SHALL forward all other events unchanged and in order.

#### Scenario: Public stream carries no internal artifact
- **GIVEN** UAR emits `effective_run_policy` and `turn_manifest` artifacts during a public chat turn
- **WHEN** the stream passes through the site server
- **THEN** the client receives every other event and neither of those artifacts

### Requirement: Harness sees the unfiltered stream
A test harness SHALL be able to read the upstream stream before the filter, and that access SHALL NOT be reachable from any public route.

#### Scenario: FR-11 reads the artifacts
- **GIVEN** the FR-11 test runs a chat turn through the harness
- **WHEN** UAR emits the two artifacts
- **THEN** the harness observes both, and the public response for the same turn contains neither
