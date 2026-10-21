## ADDED Requirements

### Requirement: A push to main runs the server lint and tests before the image is built

The deploy workflow SHALL run the server checks (clippy with warnings denied, and the server tests, through the shared reusable workflow) on every push to `main`, and the image build SHALL NOT start unless both the web Verify job and the server job succeeded. A structural check run in the Verify steps SHALL fail when the image job no longer waits for the server job.

#### Scenario: The server checks are green

- **WHEN** a push to `main` passes the web Verify job and the server job
- **THEN** the image build and the deploy proceed as before

#### Scenario: The server checks are red

- **WHEN** a push to `main` fails the server job
- **THEN** the image job does not run, and nothing is deployed

#### Scenario: The wait is removed

- **WHEN** a change removes `server` from the image job's `needs`
- **THEN** the structural check fails in the Verify steps of the pull request and of the deploy workflow

#### Scenario: Both workflows share the server checks

- **WHEN** the pull request workflow and the deploy workflow run the server checks
- **THEN** both call `.github/workflows/server-verify.yml`
