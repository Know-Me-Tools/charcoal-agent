## ADDED Requirements

### Requirement: The front page offers a way straight back to the latest saved conversation

On the public site build, the front page SHALL show a button that opens the visitor's most recently updated saved conversation directly, when this browser holds at least one saved (non-ephemeral) conversation. The button SHALL NOT be shown when there is no saved conversation, when the only conversations are unsaved drafts, or before the saved conversations have been read. Its appearance SHALL NOT cause a cumulative layout shift of 0.1 or more on the front page, and its target SHALL be at least 44 px high and wide.

#### Scenario: A returning visitor with saved conversations

- **WHEN** a visitor whose browser holds saved conversations opens the front page
- **THEN** the button is shown once the saved conversations have been read
- **AND** activating it opens the most recently updated saved conversation with its messages

#### Scenario: Several saved conversations

- **WHEN** the browser holds more than one saved conversation
- **THEN** the button opens the one with the latest update time, not the first or the oldest

#### Scenario: No history

- **WHEN** the browser holds no saved conversation, or only unsaved drafts
- **THEN** the button is not shown

#### Scenario: Before the saved conversations are read

- **WHEN** the front page has just loaded and the saved conversations have not been read yet
- **THEN** the button is not shown yet
- **AND** when it appears, the layout shift measured on the front page stays under 0.1

#### Scenario: The existing header link

- **WHEN** the button is shown
- **THEN** the header link to the conversation list is still available
