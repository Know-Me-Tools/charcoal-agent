## ADDED Requirements

### Requirement: The site keeps every product's version and status wording in one data file
The repository SHALL hold docs/knowledge-source/product-facts.json with one row per portfolio entry. Each row SHALL carry a version, a version kind (stable, pre-release, untagged or manifest), a source URL, a checked date and the status wording from the portfolio or the repository, never stated more strongly than either.

#### Scenario: A stable version matches its release
- **WHEN** the checker runs with --live
- **THEN** every row of kind stable has the version of the latest stable GitHub release of its repository

#### Scenario: A wrong version is caught
- **WHEN** a stable row names a version that is not the latest stable release
- **THEN** the checker exits non-zero and names the row

#### Scenario: An untagged product is not given a version
- **WHEN** a repository has no tagged release
- **THEN** its row has kind untagged and carries the last-commit date instead of a version
