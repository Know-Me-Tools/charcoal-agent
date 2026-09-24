# app-shell Specification

## Purpose
TBD - created by archiving change app-shell-flat2. Update Purpose after archive.

## Requirements

### Requirement: Flat 2.0 application shell
The application shell SHALL separate the work area, navigation chrome and panels only by background tokens (canvas, chrome, surface, raised), with no borders, divider lines, drop shadows, backdrop blur or line textures.

#### Scenario: Regions separate by fill
- **WHEN** any app route is shown on desktop
- **THEN** the top bar and sidebar use the chrome token, the work area uses the canvas token, the context panel uses the surface token, and no shell element has a visible border, box shadow or backdrop filter

#### Scenario: No sub-12px text
- **WHEN** the shell renders at the default font size
- **THEN** no text in the top bar, sidebar, context panel, mobile navigation or drawer is smaller than 12px

### Requirement: Navigation state treatment
The shell SHALL show the active destination with an ember-tinted fill and stronger text/icon colour, hover with the hover token, and keyboard focus with a fill plus a visible focus cue, never with an outline or border alone.

#### Scenario: Active destination
- **WHEN** the user is on a route under Threads, Agents or Settings
- **THEN** that destination in the top bar (desktop) or bottom nav (phone) has the ember-tinted fill, is marked `aria-current="page"`, and the other destinations do not

#### Scenario: Active thread
- **WHEN** a thread is open
- **THEN** its sidebar row has the ember-tinted fill and `aria-current="page"`, without a left border

### Requirement: Runtime status is always visible and not colour-only
The shell SHALL show the Universal Agent Runtime connection state on every desktop route using status tokens together with an icon and a text label.

#### Scenario: Connected runtime
- **WHEN** the runtime health check succeeds
- **THEN** the top bar shows a success-toned indicator with the text "Connected"

#### Scenario: Unreachable runtime
- **WHEN** the runtime health check fails
- **THEN** the indicator uses the danger tone with the text "Offline", so the state is readable without colour

### Requirement: Responsive panels never squeeze the conversation
The context panel SHALL be inline only when the viewport is at least 1280px wide; below that it SHALL open as a dismissible sheet, and on phones the thread list SHALL open as a dismissible sheet from the menu button.

#### Scenario: Tablet width
- **WHEN** a thread is open at 768px or 1024px
- **THEN** the conversation area is at least 480px wide and the context panel opens only as a sheet from the top-bar toggle

#### Scenario: Sheet behaviour
- **WHEN** a sheet (thread drawer or context panel) is open
- **THEN** the page behind is dimmed by a scrim, focus stays inside the sheet, and Escape or the named close button dismisses it

### Requirement: Shell accessibility landmarks
The shell SHALL provide a skip link to the main content and an accessible name for every icon-only control.

#### Scenario: Skip navigation
- **WHEN** a keyboard user presses Tab once after load
- **THEN** a visible "Skip to content" link receives focus and moves focus to the main landmark when activated
