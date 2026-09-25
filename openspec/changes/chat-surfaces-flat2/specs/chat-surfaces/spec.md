## ADDED Requirements

### Requirement: Flat 2.0 conversation surfaces
The thread, composer, streamed content blocks and artifact cards SHALL separate regions by background tokens only, with no borders, divider lines, drop shadows, backdrop blur, raw palette colours, hard-coded hex colours, text below 12px or opacity-dimmed text colours.

#### Scenario: No banned treatments in conversation source
- **WHEN** the Flat 2.0 guard scans the conversation thread, markdown, chat block and artifact components
- **THEN** it finds no border, divider, shadow, backdrop-blur, `ring-1`, raw palette class (for example `zinc-800`), `bg-white`, six-digit hex colour, `text-[<12px]` size or `text-*/NN` opacity colour

#### Scenario: Rendered blocks have no borders or shadows
- **WHEN** a thread containing every block type is shown
- **THEN** no message, block, code block, artifact card or composer element has a visible border width, box shadow or backdrop filter

### Requirement: Message treatment
Assistant replies SHALL render as unbubbled prose on the canvas in the long-form body face within a readable width, and user messages SHALL render as an ember-tinted filled surface aligned to the trailing edge, with body text at least 4.5:1 contrast in both themes.

#### Scenario: Assistant reply is authored prose
- **WHEN** an assistant reply is shown
- **THEN** its text has no background fill or bubble shape distinct from the canvas, uses the body (Roboto) face, and its line length does not exceed the readable prose width

#### Scenario: User message in the light theme
- **WHEN** a user message is shown in the light theme
- **THEN** it sits on the ember-tinted fill at the trailing edge and its text contrast against that fill is at least 4.5:1

#### Scenario: User message in the dark theme
- **WHEN** a user message is shown in the dark theme
- **THEN** it sits on the ember-tinted fill at the trailing edge and its text contrast against that fill is at least 4.5:1

### Requirement: Filled composer
The composer SHALL be a distinct filled surface anchored below the thread with no border, outline box or blur, and SHALL show keyboard focus through a visible fill change.

#### Scenario: Composer at rest
- **WHEN** a thread is open and the composer is not focused
- **THEN** the composer is a filled surface with no border, outline, ring or backdrop filter

#### Scenario: Composer focused
- **WHEN** the user focuses the composer input
- **THEN** the composer fill changes to a different surface token and no ember or ring outline is drawn around it

### Requirement: Block surfaces follow the event presentation table
Each streamed block SHALL use the surface assigned to its kind: thinking/reasoning and citations on the cyan-tinted surface; tool calls, tool results, memory, skill and context-update blocks on surface or raised tokens with monospace metadata of at least 12px; code on the brand code background; artifacts and A2UI cards borderless on surface tokens; status shown with a status token plus a text label.

#### Scenario: Reasoning and sources are cyan-tinted
- **WHEN** a thinking block and a citation block are shown
- **THEN** both sit on the cyan-tinted surface, the thinking block is collapsed by default and expands on user action

#### Scenario: Tool status is not colour-only
- **WHEN** a tool call is pending, running, completed or failed
- **THEN** its status is shown as a status-toned label with the state in text, and all of its metadata text is at least 12px

#### Scenario: Code uses the code background
- **WHEN** a fenced code block or code artifact is shown
- **THEN** it sits on the brand code background with a language label and a named copy action

#### Scenario: HTML artifact preview backdrop
- **WHEN** an HTML artifact preview is shown inline or full screen
- **THEN** the preview backdrop comes from a KnowMe token and the full-screen view dims the page with the scrim token instead of blur

#### Scenario: Streaming indicator
- **WHEN** an assistant reply or reasoning block is still streaming
- **THEN** the streaming cursor or pulse uses the cyan token

### Requirement: Conversation blocks fit narrow viewports
At a 320px viewport the thread SHALL not scroll horizontally, and block labels such as tool names SHALL wrap rather than being cut off.

#### Scenario: Every block at 320px
- **WHEN** a thread containing every block type is shown at 320px wide
- **THEN** the document does not scroll horizontally and each block fits within the viewport

#### Scenario: Long tool name at 320px
- **WHEN** a tool call with a long name is shown at 320px wide
- **THEN** the full tool name is visible, wrapping onto more lines if needed, with no ellipsis

### Requirement: A2UI response state is truthful
An A2UI input card SHALL report "Response captured" only after the user has submitted a response or a response for that request has been received, and not merely because the request finished streaming.

#### Scenario: Request streamed, no response yet
- **WHEN** an A2UI input request has finished streaming and the user has not responded
- **THEN** the card shows its input controls enabled and does not show "Response captured"

#### Scenario: User submits a response
- **WHEN** the user submits a response and the submission succeeds
- **THEN** the card shows "Response captured" with a success-toned label and disables its inputs

### Requirement: Mermaid artifacts render as diagrams
A Mermaid artifact SHALL render as a diagram through the same renderer used for Mermaid in markdown, and SHALL fall back to its source with a visible error label when rendering fails.

#### Scenario: Valid Mermaid artifact
- **WHEN** an artifact with language `mermaid` and valid source is shown
- **THEN** a rendered diagram (SVG) is shown, with a way to view and copy the source

#### Scenario: Invalid Mermaid artifact
- **WHEN** an artifact with language `mermaid` and invalid source is shown
- **THEN** the source is shown with a plain-language error label and no raw exception text

### Requirement: Accessible thread with every block type
A thread containing every block type SHALL pass automated accessibility checks in both themes.

#### Scenario: Axe on the fixture thread
- **WHEN** axe scans the streamed fixture thread with every block type in the light and the dark theme
- **THEN** it reports no `color-contrast`, `button-name` or `nested-interactive` violations inside the thread region
