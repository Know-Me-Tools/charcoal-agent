## ADDED Requirements

### Requirement: The concierge's opening reflects the whole portfolio
The empty state of a new conversation SHALL offer prompt chips that cover the portfolio's product families, and each chip SHALL start the conversation with its prompt. The opening text SHALL NOT claim a product is available that its facts row marks proposed or planned.

#### Scenario: Chips cover the families
- **WHEN** a new conversation is opened
- **THEN** chips for the portfolio's families are shown

#### Scenario: A chip starts the conversation
- **WHEN** the visitor activates a chip
- **THEN** the chip's prompt is sent as the first message
