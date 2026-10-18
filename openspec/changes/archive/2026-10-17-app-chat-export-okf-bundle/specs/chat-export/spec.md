## ADDED Requirements

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
