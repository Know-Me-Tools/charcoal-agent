## ADDED Requirements

### Requirement: A2UI surfaces render as components
The client SHALL render an `a2ui` artifact as an A2UI surface using only the nine UAR components, and SHALL NOT show it as a code block or text.

#### Scenario: Surface arrives
- **GIVEN** UAR emits an `a2ui` artifact with a Card, Text and Column
- **WHEN** the client receives it
- **THEN** a card with its text renders, keyboard-reachable, in both themes

### Requirement: Official A2UI is pinned exactly
`package.json` SHALL pin the A2UI packages with no ranges, and the lockfile SHALL contain exactly one version of each official package.

#### Scenario: Lockfile
- **GIVEN** `npm ls` runs for the A2UI packages
- **WHEN** output is read
- **THEN** one version of each official package, matching the pins

### Requirement: Surfaces are render-only
Any A2UI action SHALL be denied by default and no action SHALL be sent to UAR from a surface in this change.

#### Scenario: Button press
- **GIVEN** a surface contains a Button with an action
- **WHEN** the user activates it
- **THEN** nothing is sent and the control is shown disabled
