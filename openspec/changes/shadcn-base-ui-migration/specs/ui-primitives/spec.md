## ADDED Requirements

### Requirement: Modal overlays trap focus and dismiss predictably
Dialogs and sheets SHALL move focus inside when opened, keep Tab focus inside while open, close on Escape and on a pointer press outside, and return focus to the element that opened them.

#### Scenario: Escape closes a dialog
- **WHEN** a dialog is open and the user presses Escape
- **THEN** the dialog closes and focus returns to the control that opened it

#### Scenario: Focus stays inside
- **WHEN** a dialog is open and the user presses Tab repeatedly
- **THEN** focus cycles only among the dialog's focusable elements

### Requirement: Select is operable by keyboard
A select control SHALL open from the keyboard, move through options with arrow keys, choose with Enter, and report the chosen value to the page.

#### Scenario: Keyboard selection
- **WHEN** the user focuses a select, presses Enter, presses ArrowDown and Enter
- **THEN** the select shows the chosen option and the page receives its value

### Requirement: Tooltips are reachable without a pointer
A tooltip SHALL appear when its trigger receives keyboard focus and hide on Escape or blur.

#### Scenario: Focus shows a tooltip
- **WHEN** the user tabs to an icon button that has a tooltip
- **THEN** the tooltip text is shown and exposed to assistive technology

### Requirement: Switches and collapsibles report state
A switch SHALL toggle with Space and expose its checked state; a collapsible trigger SHALL toggle its region and expose its expanded state.

#### Scenario: Switch by keyboard
- **WHEN** the user focuses a switch and presses Space
- **THEN** its checked state flips and the page receives the new value
