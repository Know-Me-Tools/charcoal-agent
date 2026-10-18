## ADDED Requirements

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
