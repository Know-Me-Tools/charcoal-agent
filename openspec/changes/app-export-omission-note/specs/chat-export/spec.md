## ADDED Requirements

### Requirement: Export says when visible content was left out

The exported conversation SHALL end with one plain line when at least one block the visitor could see was dropped from the file. A block is visible-and-dropped when it is an artifact outside the exported source types or an image that is not own-host or same-origin. The line SHALL name the kinds of content left out and SHALL NOT contain any text, URL or identifier from the dropped block.

#### Scenario: A form artifact was dropped

- **WHEN** the visitor exports a conversation that contains a form, confirm or display artifact
- **THEN** the file ends with the omission line
- **AND** no text from the artifact appears in the file

#### Scenario: A remote image was dropped

- **WHEN** the visitor exports a conversation that contains an image hosted outside the site
- **THEN** the file ends with the omission line
- **AND** the image URL does not appear in the file

#### Scenario: Nothing visible was dropped

- **WHEN** the visitor exports a conversation made only of text, citations, own-host images and exported source artifacts
- **THEN** the file has no omission line

#### Scenario: Hidden block types do not trigger the line

- **WHEN** the conversation contains reasoning, tool-call, step, skill-activation, context-update or memory blocks and nothing else is dropped
- **THEN** the file has no omission line

#### Scenario: Export stays client-side

- **WHEN** the omission line is added
- **THEN** the export still makes no network request
