## ADDED Requirements

### Requirement: Bounded conversation width
The conversation view SHALL constrain the message list and composer to a maximum readable width (48rem) centered in the available space, at every viewport width wider than that maximum.

#### Scenario: Wide viewport
- **WHEN** a thread is open in a 1440px-wide window
- **THEN** message content and the composer are no wider than 48rem and are horizontally centered

#### Scenario: Narrow viewport
- **WHEN** a thread is open in a 320px-wide window
- **THEN** message content and the composer fill the available width without horizontal page scrolling

### Requirement: Long text wraps
Message bubbles SHALL wrap long unbroken strings (URLs, identifiers) inside their container rather than overflowing it.

#### Scenario: Unbroken URL in a user message
- **WHEN** a user message contains a 300-character URL with no spaces
- **THEN** the text wraps within the message bubble and no horizontal scrollbar appears on the page
