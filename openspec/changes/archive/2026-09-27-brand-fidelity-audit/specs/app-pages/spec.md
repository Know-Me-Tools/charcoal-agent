## ADDED Requirements

### Requirement: The create-agent route reads as create
`/agents/new` SHALL render the agent form in create mode: a create heading and a create action. It SHALL NOT render the edit heading or the save action.

#### Scenario: Create mode on /agents/new
- **WHEN** `/agents/new` is loaded against the UAR mock
- **THEN** the page heading reads "Create Agent" and the primary action is named "Create agent"
- **AND** neither "Edit Agent" nor "Save agent" is present

### Requirement: Skill details open in an accessible dialog
Each skill's details control on `/settings/skills` SHALL have an accessible name that includes the skill's title. The details panel SHALL be a modal dialog: it has `role="dialog"` and an accessible name, it moves focus inside when opened, it keeps focus inside while open, it closes on Escape, and it returns focus to the control that opened it.

#### Scenario: Details controls are distinguishable
- **WHEN** `/settings/skills` is loaded with at least two fixture skills
- **THEN** every details control's accessible name contains its skill's title, and no two names are the same

#### Scenario: Dialog keyboard behaviour
- **WHEN** a skill's details control is activated by keyboard
- **THEN** an element with `role="dialog"` and an accessible name is visible, and focus is inside it
- **AND** pressing Escape closes it and returns focus to the control that opened it

### Requirement: Skill toggles expose their state
Each skill's enable control SHALL expose its on or off state to assistive technology, as a switch with `aria-checked` or a button with `aria-pressed`. Its accessible name SHALL include the skill's title.

#### Scenario: Toggle state and name
- **WHEN** `/settings/skills` is loaded with one enabled and one disabled fixture skill
- **THEN** each toggle's accessible name contains its skill's title
- **AND** the enabled skill's toggle reports checked or pressed, and the disabled skill's toggle reports not checked or not pressed
