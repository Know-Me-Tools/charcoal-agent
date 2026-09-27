## Why

The app pages behind the shell (threads list, agents, agent detail, and the settings pages for providers, skills, appearance and account) still use the pre-rebrand treatment. Measured on this branch on 2026-09-27:

- **Raw palette classes.** `grep -rnE '(bg|text|ring|border)-(zinc|slate|gray|green|amber|blue|purple|red|orange)-[0-9]' src/pages` returns 8 lines: `agents-page.tsx` 163 and 183, and `skills-page.tsx` 58, 59, 212, 213, 270 and 284. Status is shown with colour alone (green "Saved", amber/green skill state, purple/blue source labels).
- **Type below the 12px floor.** There are 32 `text-[9px]`, `text-[10px]` and `text-[11px]` uses across `agents-page`, `agent-detail-page`, `providers-page`, `skills-page` and `user-settings-page` (S1 §4.2).
- **Flat 2.0 violations.** The pages use bordered sections and bordered inputs, and the providers table uses rule lines. S1 §3.3 bans all of these. The pages are not yet covered by `src/test/flat-shell.test.ts`.
- **Invisible keyboard focus.** The `Button` primitive's unconditional `outline-none` stops `focus-visible:outline-*` from painting (`docs/design/brand-pages.md`, "Why native elements"). The app pages use `Button` throughout, so the landing workaround of switching to native elements does not scale.

This is plan item 11 of the complete-rebranding phase. Plan item 12 (brand-fidelity-audit) depends on it.

## What Changes

- Restyle the eight in-scope pages to Flat 2.0:
  - filled inputs with no border
  - sections grouped on `bg-band` surfaces, not borders
  - list and table rows separated by row backgrounds, not rules
- Replace every raw palette class with the status tokens (`success`, `warning`, `danger` plus their `-soft` and `-text` pairs) or `StatusBadge`. Every status also gets a text or icon cue, so colour is never the only signal.
- Remove every arbitrary text size below 12px in `src/pages`.
- Bring settings copy in line with D-004: the runtime is "Universal Agent Runtime" (UAR), the agent is "KnowMe agent", and no "Charcoal" appears.
- Fix keyboard focus once, in the `Button` primitive, so every `Button` shows the `focus-cue` outline (design.md decision 3).
- Extend the Flat 2.0 guard to the in-scope pages.
- **Do not adopt** `EntityListView`, `EntityTable`, `EntityDetailSheet` or `EntityFormSheet` from `@prometheus-ags/prometheus-entity-management` 4.0.2. They hard-code borders, shadows, backdrop blur, sub-12px text and `focus:outline-none`, and none of that can be changed through tokens (evidence in design.md decision 1). The existing components stay. The reason goes in the phase decision log, and an upstream request goes to the package owner.

**Correction to the plan's acceptance criterion.** The plan asks for "CRUD on agents/providers/skills". The client does not support that. Only providers have all four operations. Agents have create (compile) and update (memory settings) but no delete. Skills have toggle and refresh but no create or delete (`src/hooks/use-agents.ts`, `use-skills.ts`, `use-providers.ts`). This change keeps every operation that exists today working and adds none.

## Non-goals

- `thread-detail-page.tsx` (the chat surface, done in chat-surfaces-flat2), landing, about and 404 (done in landing-and-about-brand).
- New entity features, new fields or changes to the data layer (`src/lib/entity-graph/`, `src/hooks/`).
- Forking or patching the entity-management package.
- New colour tokens. The existing `band`, `surface`, status and `ring` tokens are enough (design.md decision 2).
- Whole-site golden snapshots and repo-wide greps. Those belong to brand-fidelity-audit.

## Capabilities

### New Capabilities
- `app-pages`: Flat 2.0 treatment, status semantics, type floor, keyboard focus and CRUD continuity for the threads, agents, agent-detail and settings pages.

### Modified Capabilities
None.

## Impact

- **Code:** `src/pages/{threads,agents,agent-detail,providers,skills,appearance,user-settings,settings}-page.tsx`, `src/components/ui/button.tsx` (focus only), plus any page-local components those pages import that carry the same violations.
- **Tests:** `src/test/flat-shell.test.ts` (new `describe` block), a new `e2e/app-pages.spec.ts`, and possibly `e2e/support/routes.ts` ready texts.
- **Docs:** `openspec/changes/app-pages-flat2-entity-views/verification.md` and a phase decision-log entry for the adoption decision.
- **Risk to other surfaces:** the `Button` focus fix changes every `Button` in the app, including chat. See the design.md Risks.
