## ADDED Requirements

### Requirement: Launch run policy proven by policy and manifest
The deployed `knowme-site` agent SHALL run every public chat turn under the launch run policy, and the FR-11 test SHALL prove it from the run's `effective_run_policy` and `turn_manifest`, not from the agent file.

#### Scenario: Policy and manifest match the allowlist
- **GIVEN** the seeded `knowme-site` agent and an empty D-15 list
- **WHEN** the test reads the `effective_run_policy` and `turn_manifest` of a real public chat turn through the proxy test harness
- **THEN** `tools.mode` is `none` or `selected` with no ids, skills and MCP servers are `none`, `tool_approval == deny`, and `turn_manifest.selected_tools` equals the allowlist plus `activate_skill`

#### Scenario: Loosened policy fails the test
- **GIVEN** a policy with `tools.mode` of `auto`, `all` or `inherit`, an id not on the list, or an extra model-facing tool
- **WHEN** the FR-11 test runs
- **THEN** it fails

### Requirement: No tool executes on the public path
A public chat turn SHALL execute no tool, and a call to `activate_skill` SHALL be denied.

#### Scenario: Tool-eliciting prompts
- **GIVEN** the tool-eliciting prompt set
- **WHEN** it runs against the deployed agent
- **THEN** no stream carries a tool start or tool result event

#### Scenario: Forced activate_skill call
- **GIVEN** the forced-call fixture that makes the model call `activate_skill`
- **WHEN** it runs against the deployed agent
- **THEN** the stream carries `agui.tool_call.denied`

### Requirement: Memory capture off
The site server SHALL inject `memory_enabled: false` into every forwarded chat turn.

#### Scenario: Five-turn session leaves no memory
- **GIVEN** a scripted five-turn public session
- **WHEN** it finishes
- **THEN** the effective run policy shows memory disabled and a direct SurrealDB query finds no new memory rows for `user_id=knowme-site`

### Requirement: Guardrail detect-only in Phase 0
UAR input screening SHALL stay enabled in detect-only mode for Phase 0, and flagged inputs SHALL be logged.

#### Scenario: Flagged input logged, not blocked
- **GIVEN** `UAR_GUARDRAILS__INPUT_SCREENING_ENABLED` is on and blocking is off
- **WHEN** a visitor input matches the guardrail
- **THEN** UAR logs the flag and the turn is not blocked
