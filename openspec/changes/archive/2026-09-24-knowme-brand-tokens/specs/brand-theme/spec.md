## ADDED Requirements

### Requirement: KnowMe palette in both themes
The app SHALL render with the KnowMe palette in both themes: a four-level surface ladder (canvas, chrome, surface, raised) plus hover and muted surfaces, ember as the brand/action color, cyan for AI activity, and green/amber/red reserved for status.

#### Scenario: Dark theme canvas
- **WHEN** the app is shown in the dark theme
- **THEN** the page background is `#0B0F14` and primary text is `#E8EDF3`

#### Scenario: Light theme canvas
- **WHEN** the app is shown in the light theme
- **THEN** the page background is `#F7F7F8` and primary text is `#0B0F14`

### Requirement: Text meets WCAG AA contrast
Every text color token SHALL reach at least 4.5:1 contrast against every surface token of its theme, and text on primary and destructive fills SHALL reach at least 4.5:1 against the fill.

#### Scenario: Faint text on the busiest surface
- **WHEN** faint (metadata) text is shown on the muted surface in dark mode
- **THEN** its contrast ratio is at least 4.5:1

#### Scenario: Primary button label
- **WHEN** a primary button is shown in the light theme
- **THEN** its label has at least 4.5:1 contrast against the ember fill

### Requirement: Flat surfaces
Areas and components SHALL be separated by background-color changes, not by visible borders or drop shadows, unless a component explicitly opts into an outline for a documented reason.

#### Scenario: Default border
- **WHEN** an element uses the default border utility without a color
- **THEN** no visible border is drawn

### Requirement: Theme choice persists
The user's theme choice SHALL persist across reloads and apply before the first paint; dark is the default when no choice has been made.

#### Scenario: Light theme survives reload
- **WHEN** the user switches to the light theme and reloads the page
- **THEN** the page renders in the light theme without first flashing the dark theme

#### Scenario: First visit
- **WHEN** a user opens the app with no saved preference
- **THEN** the dark theme is used

### Requirement: Readable type scale
Interface text SHALL NOT be rendered below 12 px by the shared type-role utilities, and the appearance page's font-size setting SHALL scale the interface.

#### Scenario: Comfortable font size
- **WHEN** the user selects the comfortable font size
- **THEN** text across the app renders larger than at the default size
