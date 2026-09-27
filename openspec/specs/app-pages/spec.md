# app-pages Specification

## Purpose
Defines how the app pages behind the shell look and behave after the rebrand: the threads list, agents, agent detail, and the providers, skills, appearance and account settings pages. It covers Flat 2.0 surfaces, token-based status, the 12px type floor, visible keyboard focus, settings copy, and unchanged create, read, update and delete behaviour.

## Requirements

### Requirement: In-scope pages
The requirements in this capability SHALL apply to these routes, which are called the in-scope routes:
- `/threads`
- `/agents`, `/agents/new` and `/agents/:id`
- `/settings/providers`
- `/settings/skills`
- `/settings/appearance`
- `/settings/account`

They SHALL also apply to the source files that render those routes, called the in-scope files: `src/pages/{threads,agents,agent-detail,providers,skills,appearance,user-settings,settings}-page.tsx`.

#### Scenario: Every in-scope route renders against the mock
- **WHEN** each in-scope route is loaded against the UAR mock at 1440×900 in both themes
- **THEN** the route's ready text from `e2e/support/routes.ts` is visible
- **AND** no uncaught page error is logged

### Requirement: Token-based status with a non-colour cue
The in-scope files SHALL NOT use raw Tailwind palette classes. Status (saved, enabled, disabled, error, source type) SHALL use the KnowMe status tokens or `StatusBadge`. Every status SHALL also carry a text label or an icon with an accessible name, so colour is never the only signal (WCAG 1.4.1).

#### Scenario: No raw palette classes in pages
- **WHEN** `grep -rnE '(bg|text|ring|border)-(zinc|slate|gray|green|amber|blue|purple|red|orange)-[0-9]' src/pages` is run
- **THEN** it returns nothing

#### Scenario: Skill state is readable without colour
- **WHEN** `/settings/skills` is loaded with one enabled and one disabled fixture skill
- **THEN** each skill row exposes its state as visible text or as the accessible name of a control or icon
- **AND** the two rows' state texts differ

#### Scenario: Agent save confirmation is readable without colour
- **WHEN** an agent's settings are saved on `/agents` and the mock returns success
- **THEN** a confirmation with visible text is shown, styled with a status token class and not a raw palette class

### Requirement: Type floor
Rendered text in the in-scope files SHALL be at least 12px. Arbitrary sizes below 12px SHALL NOT appear.

#### Scenario: No sub-12px arbitrary sizes
- **WHEN** `grep -rnE 'text-\[(9|10|11)(\.[0-9]+)?px\]' src/pages` is run
- **THEN** it returns nothing

#### Scenario: No rendered text under 12px
- **WHEN** each in-scope route is loaded at 1440×900
- **THEN** every visible element with a non-empty direct text node has a computed `font-size` of at least 12px

### Requirement: Flat 2.0 surfaces
The in-scope pages SHALL follow Flat 2.0 (S1 §3.3):
- no borders, shadows, gradients or backdrop blur
- inputs, selects and textareas SHALL be filled fields with no border
- related settings SHALL be grouped on a `bg-band` surface, not separated by rules or borders
- table and list rows SHALL be separated by row background (spacing, alternating fill or hover fill), not by rule lines

The Flat 2.0 source guard in `src/test/flat-shell.test.ts` SHALL cover the in-scope files.

#### Scenario: Source guard covers the pages
- **WHEN** `npx vitest run src/test/flat-shell.test.ts` is run
- **THEN** a `describe` block over the in-scope files passes with the border, divider, shadow, blur, ring-outline, sub-12px and gradient rules
- **AND** adding `border border-border` to any in-scope file makes that block fail

#### Scenario: Nothing renders a border, shadow or blur
- **WHEN** each in-scope route is loaded in both themes
- **THEN** no visible element inside `main` has a computed border width above 0 with a non-transparent border colour
- **AND** no visible element inside `main` has a computed `box-shadow` other than `none` while unfocused
- **AND** no visible element inside `main` has a `backdrop-filter` other than `none`, or a `background-image` containing `gradient`

#### Scenario: Grouped sections are distinct from the canvas in light theme
- **WHEN** `/settings/account` and `/settings/providers` are loaded in the light theme
- **THEN** each settings group's computed background colour equals the resolved `--km-band` value, and differs from the page canvas colour

#### Scenario: No horizontal scroll at 320
- **WHEN** each in-scope route is loaded at 320px wide in both themes
- **THEN** `document.documentElement.scrollWidth` is at most 320

### Requirement: Visible keyboard focus
Every focusable control on an in-scope route SHALL show a visible focus indicator when reached by keyboard. The indicator SHALL be the `focus-cue` treatment: a 2px solid `ring`-token outline with a 2px offset. This applies to `Button`-based controls, native controls and third-party controls alike (WCAG 2.4.7, 2.4.11).

#### Scenario: Tab-through shows an outline on every stop
- **WHEN** each in-scope route is loaded and the Tab key is pressed repeatedly until focus leaves `main` or returns to the first stop
- **THEN** for every element that receives focus inside `main`, the computed `outline-style` is not `none` and the computed `outline-width` is at least 2px
- **AND** the number of focus stops is recorded per route in the QA note

#### Scenario: Button primitive paints its outline
- **WHEN** a `Button` from `src/components/ui/button.tsx` is rendered and focused by keyboard
- **THEN** its computed `outline-style` is `solid`, and its `outline-color` equals the resolved `--ring` value

### Requirement: Settings copy follows D-004
Settings copy SHALL call the backend "Universal Agent Runtime" (or "UAR" after first use), and SHALL call the built-in agent "KnowMe agent". No user-visible text in the in-scope routes SHALL contain "Charcoal".

#### Scenario: No Charcoal in rendered settings
- **WHEN** each `/settings/*` in-scope route is loaded
- **THEN** `document.body.innerText` does not match `/charcoal/i`

### Requirement: Entity CRUD continuity
Every entity write the in-scope pages expose today SHALL keep working through the existing entity-graph hooks after the restyle. Each write SHALL send the same HTTP method and path as before, and the page SHALL reflect the result. The writes the client exposes are:
- providers: create, update, set default and delete
- agents: create (compile) and update (memory settings)
- skills: toggle and refresh

Reads cover all three entities. The client has no agent delete, skill create or skill delete, and this change SHALL NOT add them.

#### Scenario: Provider create, update, default and delete against the mock
- **WHEN** on `/settings/providers` a provider is added, edited, set as default and deleted against the UAR mock
- **THEN** the mock receives `POST /api/providers`, `PUT /api/providers/:id`, `POST /api/providers/:id/default` and `DELETE /api/providers/:id` in that order
- **AND** no error message is shown

#### Scenario: Agent create against the mock
- **WHEN** a new agent is submitted from `/agents/new`
- **THEN** the mock receives `POST /api/compiler/compile`
- **AND** no error message is shown

#### Scenario: Agent update against the mock
- **WHEN** an agent's memory settings are edited and saved on `/agents`
- **THEN** the mock receives `PATCH /api/agents/:id`
- **AND** the save confirmation text is shown after the response

#### Scenario: Skill toggle and refresh against the mock
- **WHEN** on `/settings/skills` a skill is toggled and the list is refreshed
- **THEN** the mock receives `POST /api/skills/:id/toggle` and `POST /api/skills/refresh`
- **AND** the existing `e2e/skills-toggle.spec.ts` tests still pass

### Requirement: Entity view component adoption is decided and recorded
The in-scope pages SHALL NOT import `EntityListView`, `EntityTable`, `EntityDetailSheet` or `EntityFormSheet` from `@prometheus-ags/prometheus-entity-management` while the installed version hard-codes Flat 2.0 violations that tokens cannot remove. The reason SHALL be recorded in the phase decision log with evidence from the package source.

#### Scenario: Components are not imported
- **WHEN** `grep -rnE 'EntityListView|EntityTable|EntityDetailSheet|EntityFormSheet' src` is run
- **THEN** it returns nothing

#### Scenario: Decision is recorded
- **WHEN** `.kbd-orchestrator/phases/complete-rebranding/decision-log.md` is read
- **THEN** it has an entry naming the four components, the package version, the offending classes, and the condition for revisiting the decision
