## ADDED Requirements

### Requirement: Runs without a live backend
The verification harness SHALL start the application and serve every backend request the UI makes from local fixtures, so that it runs identically on any developer machine or CI runner with no UAR available.

#### Scenario: No UAR reachable
- **WHEN** `npm run test:e2e` runs on a machine with no UAR instance and no network access to one
- **THEN** every page renders fixture data instead of loading skeletons or error states, and the run completes

#### Scenario: Unmocked request
- **WHEN** the UI issues a request to a backend path that has no fixture
- **THEN** the harness answers it with an explicit error response and records the unmocked path in the test output rather than letting it reach the network

### Requirement: Route × viewport × theme screenshots
The harness SHALL capture a full-page screenshot of every application route at viewport widths 320, 768, 1024 and 1440 px in both dark and light themes.

#### Scenario: Screenshot matrix
- **WHEN** `npm run test:visual` completes
- **THEN** the output directory contains one screenshot per route, width and theme combination, named by route, width and theme

#### Scenario: Conversation with every block type
- **WHEN** the thread route is captured
- **THEN** the conversation shown contains a user message and an assistant reply with text, thinking, a tool call with its result, a citation, a skill activation, a context update, memory recall and mutation, an artifact, and an A2UI display artifact

### Requirement: Accessibility scan
The harness SHALL run an automated WCAG 2.x A/AA accessibility scan (including color contrast) on every route in both themes and write the findings to a machine-readable report.

#### Scenario: Report-only mode
- **WHEN** `npm run test:a11y` runs without `AXE_STRICT` set and violations exist
- **THEN** the run passes and the report lists each violation with rule id, impact, route, theme and affected element count

#### Scenario: Strict mode
- **WHEN** `npm run test:a11y` runs with `AXE_STRICT=1` and any violation exists
- **THEN** the run fails and names the violating rules and routes
