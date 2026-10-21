# site-e2e-coverage Specification

## Purpose
TBD - created by archiving change qa-browser-matrix. Update Purpose after archive.

## Requirements

### Requirement: The reset notice and the export omission line are exercised in Chromium, WebKit and Firefox

The end-to-end tests for the reset notice and for the export omission line SHALL run in the Chromium, desktop WebKit and Firefox Playwright projects, and each run SHALL record its counts. A failure in one engine SHALL be classified as a product defect or an engine difference before anything is changed. Each test SHALL fail in each engine when the string it checks is altered.

#### Scenario: All engines pass

- **WHEN** the two specs run in Chromium, desktop WebKit and Firefox on the built app
- **THEN** each run's counts are recorded and any failure is classified

#### Scenario: A test that cannot fail

- **WHEN** the checked string is altered
- **THEN** the matching spec fails in every engine it runs in

#### Scenario: The e2e project type-checks

- **WHEN** `tsc --noEmit` runs on the e2e project
- **THEN** it reports no errors
