# site-server-quality Specification

## Purpose
TBD - created by archiving change site-server-gates-green. Update Purpose after archive.

## Requirements

### Requirement: Server lint and header tests pass on main

The server crate SHALL pass clippy with warnings denied and SHALL pass its test suite on `main`. The header test SHALL assert the Content-Security-Policy the server actually sends, so a weaker or changed header fails the test.

#### Scenario: Clippy on a clean checkout

- **WHEN** clippy runs with warnings denied on the server crate of a clean `main`
- **THEN** it reports no errors

#### Scenario: Header test on a clean checkout

- **WHEN** the server test suite runs on a clean `main`
- **THEN** the header test passes

#### Scenario: The header changes

- **WHEN** the server sends a Content-Security-Policy that differs from the one the test expects
- **THEN** the header test fails
