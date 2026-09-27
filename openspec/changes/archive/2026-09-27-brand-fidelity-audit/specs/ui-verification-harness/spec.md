## ADDED Requirements

### Requirement: Committed golden snapshots
The harness SHALL compare each route × width × theme capture against a golden image committed to the repository. A capture that differs from its golden beyond the configured tolerance SHALL fail `npm run test:visual`. Goldens SHALL be regenerated only by an explicit update run, and each regeneration SHALL be recorded with a reason. Content that changes between runs, such as clock-derived dates in the sidebar, SHALL be pinned or masked so that two runs on an unchanged tree produce matching captures.

#### Scenario: Goldens exist for the full matrix
- **WHEN** the committed golden directory is listed
- **THEN** it holds one image for each route, each width in 320/768/1024/1440, and each theme

#### Scenario: Unchanged tree matches
- **WHEN** `npm run test:visual` is run twice on the same tree on the platform the goldens were made on
- **THEN** both runs pass

#### Scenario: A visual change fails
- **WHEN** a token colour used by the landing hero is changed and `npm run test:visual` is run
- **THEN** the landing captures fail against their goldens and a diff image is written
