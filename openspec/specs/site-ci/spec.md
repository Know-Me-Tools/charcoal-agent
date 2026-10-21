# site-ci Specification

## Purpose
TBD - created by archiving change ci-pr-checks. Update Purpose after archive.

## Requirements

### Requirement: A pull request runs the web and server checks without deploying

Every pull request SHALL run the web Verify steps (pins, manifests, lint, unit tests, build) and the server lint and tests in GitHub Actions, using a read-only token and no secrets. A pull request run SHALL NOT build or push an image and SHALL NOT deploy. The server checks SHALL run the server crate's clippy with warnings denied and its tests, on the Rust version named in `versions.toml`, against the tracked fixture web directory.

#### Scenario: A clean pull request

- **WHEN** a pull request changes nothing that breaks a lint or a test
- **THEN** the web job and the server job both pass
- **AND** no image is built and nothing is deployed

#### Scenario: A server lint error

- **WHEN** a pull request introduces a clippy error in `server/`
- **THEN** the server job fails and the pull request run is red

#### Scenario: A server test failure

- **WHEN** a pull request makes a server test fail
- **THEN** the server job fails and the pull request run is red

#### Scenario: Permissions

- **WHEN** the pull request workflow runs
- **THEN** its token has `contents: read` only
- **AND** no repository or organization secret is referenced

#### Scenario: One definition of the server checks

- **WHEN** the deploy workflow also runs the server checks
- **THEN** both workflows call the same reusable workflow, so the checks cannot drift apart

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
