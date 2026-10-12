## ADDED Requirements

### Requirement: The public stream is an allowlist
The site server SHALL forward only events and `agui.artifact` types on an explicit allowlist, and SHALL drop and log every other event, every unlisted artifact type and every artifact whose type cannot be read.

#### Scenario: Diagnostics do not reach visitors
- **GIVEN** UAR emits `provider_event`, `attempt_manifest`, `effective_run_policy` and `turn_manifest` artifacts
- **WHEN** the stream passes through the site server
- **THEN** the client receives none of them

#### Scenario: A new internal type does not leak
- **GIVEN** UAR starts emitting an artifact type nobody listed
- **WHEN** the stream passes through the site server
- **THEN** the type is dropped and a WARN is logged

### Requirement: The meter and the client keep what they need
Filtering SHALL NOT remove the usage-bearing completion event the spend meter reads, nor the text and error events the client renders.

#### Scenario: A turn still settles
- **GIVEN** a public turn completes with usage
- **WHEN** the stream is filtered
- **THEN** the meter records one settlement for the turn
