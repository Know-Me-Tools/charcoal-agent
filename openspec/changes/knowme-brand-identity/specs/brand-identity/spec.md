## ADDED Requirements

### Requirement: Official mark and wordmark
The app SHALL display the KnowMe "Conviction" monogram with its ember node and the "Know" + ember "Me" wordmark wherever the product name is shown as brand identity, never plain text or a generic icon, and the mark SHALL have an accessible name.

#### Scenario: Navigation lockup
- **WHEN** any app page is open
- **THEN** the top bar shows the KnowMe mark followed by the wordmark, and assistive technology reads "KnowMe"

#### Scenario: Chat welcome
- **WHEN** a new, empty thread is shown
- **THEN** the welcome state shows the KnowMe mark instead of a generic icon

### Requirement: Browser and social identity
The browser tab and link previews SHALL use KnowMe assets hosted by the app itself: a KnowMe favicon, an Apple touch icon, and a KnowMe social preview image with the approved tagline.

#### Scenario: Shared link preview
- **WHEN** the app's URL is shared
- **THEN** the preview title is "KnowMe", the description uses the approved tagline "AI that understands you.", and the image URL points at the app's own origin

### Requirement: Desktop shell identity
The desktop application SHALL be named "KnowMe" and use the KnowMe app icon.

#### Scenario: Desktop window
- **WHEN** the desktop app launches
- **THEN** its window title is "KnowMe" and its bundle icons are generated from the KnowMe app-icon source

### Requirement: Correct product and legal naming
User-visible text SHALL refer to the product as "KnowMe", to the backend as the Universal Agent Runtime hosting the KnowMe agent, and to the company as "KnowMe AI, LLC"; it SHALL NOT mention a "Charcoal Agent".

#### Scenario: Built-in skill description
- **WHEN** a built-in skill's details are shown
- **THEN** it is described as a skill of the KnowMe agent, not of a "Charcoal Agent"

#### Scenario: Legal line
- **WHEN** the landing page footer or About page is shown
- **THEN** it includes "© 2026 KnowMe AI, LLC"
