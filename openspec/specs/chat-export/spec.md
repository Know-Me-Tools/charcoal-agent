# chat-export Specification

## Purpose
TBD - created by archiving change app-chat-export-okf-single. Update Purpose after archive.

## Requirements

### Requirement: A visitor can export the current conversation as one OKF v0.2 markdown document
The chat SHALL offer an Export menu that saves the current conversation as a single Open Knowledge Format v0.2 markdown file, built in the browser from an allowlist of block types, and SHALL also offer Copy as Markdown.

#### Scenario: Save
- **WHEN** the visitor chooses Save on a conversation
- **THEN** the file contains OKF frontmatter, the visitor's messages and the reply text with sources as footnotes
- **AND** blocks outside the allowlist are left out

#### Scenario: Mobile save
- **WHEN** the visitor taps Save on a phone
- **THEN** the file is already built when the tap happens, so the share sheet or download starts inside the tap
- **AND** when neither works, the Markdown is shown on screen for manual copy

### Requirement: Export makes no network request and leaks no secrets
Export SHALL make zero network requests between the click and the finished download, and no export SHALL contain credentials, internal identifiers or markup that renders as active content.

#### Scenario: Privacy proof
- **WHEN** the visitor exports a conversation
- **THEN** no request leaves the page other than loading the app's own code
- **AND** the menu states that nothing is sent anywhere

### Requirement: A visitor can export all saved conversations as one zip bundle
The chat SHALL offer Export all, which builds a zip in the browser containing `index.md` (with `okf_version`), `log.md` and one concept file per conversation under `conversations/`, with unique, safe filenames.

#### Scenario: Bundle contents
- **WHEN** the visitor exports 50 saved conversations
- **THEN** the zip holds 52 entries: the index, the log and 50 conversation files
- **AND** colliding titles produce distinct filenames

#### Scenario: Two-step on touch devices
- **WHEN** the visitor uses Export all on a touch device
- **THEN** Prepare builds the zip with progress, and a separate Save button calls share or download synchronously inside its tap

### Requirement: Building the bundle does not freeze the page
The zip SHALL be built in slices that yield to the main thread, in a lazily loaded chunk, and SHALL warn before saving a bundle over 50 MB.

#### Scenario: Large bundle
- **WHEN** the visitor prepares 300 conversations
- **THEN** no frame gap exceeds 100 ms and the zip library loads only on the first Prepare

### Requirement: The bundle export makes no network request
Prepare and Save SHALL make no network request other than loading the app's own code.

#### Scenario: Privacy proof
- **WHEN** the visitor prepares and saves a bundle
- **THEN** no request leaves the page between the Export click and the finished download
