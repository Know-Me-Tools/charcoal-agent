## ADDED Requirements

### Requirement: A visitor can start a concierge chat from any page of the site
Every non-thread page of the public site SHALL offer an entry that starts a new concierge conversation. Activating a prompt chip or submitting an inline composer SHALL open a new thread whose first user message is that prompt, and the entry SHALL be at least 44 px in each dimension at 320 px width.

#### Scenario: A chip starts a chat
- **WHEN** the visitor activates a prompt chip
- **THEN** a new thread opens and its first user message is the chip's prompt

#### Scenario: The header entry is reachable
- **WHEN** the visitor is on a product page at 320 px
- **THEN** the Ask the concierge entry is present and at least 44 px tall
