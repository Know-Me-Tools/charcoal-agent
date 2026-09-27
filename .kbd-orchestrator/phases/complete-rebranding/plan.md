PLAN: complete-rebranding
Project: Charcoal Agent (product: KnowMe)
Date: 2026-09-23
OpenSpec available: YES
Changes to implement: 12

Inputs: assessment.md (revised after 2 adversarial rounds), decision-log.md D-001…D-007, operator answers of 2026-09-23 (legal name "KnowMe AI, LLC"; Tailwind 4; latest shadcn on Base UI + latest assistant-ui; no Charcoal Agent — UAR instance with a KnowMe agent; adopt @prometheus-ags/prometheus-entity-management latest and remove TanStack Query).

Brand sources (read-only, outside repo):
- S1 `/Users/gqadonis/Projects/know-me/know-me-system/docs/knowme-ui-ux-standard.md` — binding for app UI (Flat 2.0, surface ladder, color roles, type roles, motion)
- S2 `/Users/gqadonis/Projects/know-me/branding/knowme-brand-guide.html`, `branding/knowme-brand-template.html`, `branding/logos/*.svg` — logo, lockups, voice, taglines, type scale
- S3 `/Users/gqadonis/Projects/know-me/know-me-system/desktop/src/index.css`, `desktop/src/shared/components/KnowMeLogo.tsx`, `desktop/branding/app-icon-source.svg` — reference implementation to port

Version targets (npm, checked 2026-09-23): tailwindcss / @tailwindcss/vite 4.3.3, tw-animate-css 1.4.0, shadcn 4.21.0, @base-ui/react 1.8.0, @assistant-ui/react 0.15.21, @assistant-ui/react-markdown 0.14.16, @assistant-ui/react-devtools 1.2.20, @prometheus-ags/prometheus-entity-management 4.0.2 + @prometheus-ags/entity-graph-core 4.0.2. Pin exact resolved versions in each change; re-check at apply time.

## CHANGE LIST (ordered)

1. tailwind-v4-foundation: Upgrade to Tailwind 4 and clear the pre-existing lint/type baseline
   - Scope: build config, css, all className call sites touched by the codemod
   - Depends on: NONE
   - Recommended agent: Claude Code
   - Est. complexity: M
   - Complexity score: Medium
   - Model class: medium
   - Customer value: MEDIUM (unblocks everything; fixes the unconstrained chat column)
   - Details: Run `npx @tailwindcss/upgrade`, switch to `@tailwindcss/vite`, move config to CSS-first `@theme` (carry the *current* tokens unchanged — rebrand values come in change 6), replace `tailwindcss-animate` with `tw-animate-css`, register `@tailwindcss/typography` via `@plugin`, delete `tailwind.config.ts`, `postcss.config.js` if unused, and unimported `src/App.css`. Fix the 5 pre-existing ESLint errors and 1 `tsc` error so later gates are meaningful; add `"typecheck": "tsc --noEmit -p tsconfig.app.json"` script.
   - Acceptance: `npm run build`, `npm run typecheck`, `npm run lint` (0 errors), `npm test` all pass; the 19 v4-only classes (`max-w-(--thread-max-width)`, `wrap-break-word`, `duration-(--animation-duration)`, trailing `!`) resolve in built CSS (grep dist CSS); screens look unchanged apart from the chat column now being width-limited.

2. visual-verification-harness: Add Playwright screenshots and axe checks
   - Scope: test tooling only
   - Depends on: NONE
   - Recommended agent: Codex (isolated worktree)
   - Est. complexity: M
   - Complexity score: Medium
   - Model class: medium
   - Customer value: MEDIUM
   - Details: Add Playwright with a Vite `webServer`, a UAR mock (route interception returning fixture agents/providers/skills/sessions and a canned AG-UI SSE stream covering text, thinking, tool call, citation, memory, skill, artifact) so pages render without a live backend. One spec per route capturing 320/768/1024/1440 in dark and light, and `@axe-core/playwright` color-contrast + a11y scans. Scripts `test:e2e`, `test:visual`. Baseline snapshots are *not* committed as goldens until change 12.
   - Acceptance: `npm run test:e2e` runs green headless locally with no UAR; produces screenshots for every route × 4 widths × 2 themes and an axe report.

3. entity-graph-data-layer: Replace TanStack Query with the Prometheus entity graph
   - Scope: data hooks, App providers, package.json
   - Depends on: NONE (touches hooks, not styling)
   - Recommended agent: Claude Code (use `entity-graph-setup` / `entity-graph-crud` skills)
   - Est. complexity: L
   - Complexity score: High
   - Model class: frontier
   - Customer value: MEDIUM
   - Details: Install `@prometheus-ags/entity-graph-core@4.0.2` and `@prometheus-ags/prometheus-entity-management@4.0.2`; mount `GraphStoreProvider`; register UAR REST transports/schemas for Agent, Provider, Model, Skill, Session, Run, UserSettings via the existing `api-client` (keeping `X-UAR-Session-ID`). Migrate all 50 `useQuery/useMutation/useQueryClient` sites across the 10 importing files (`App.tsx`, `features/chat/use-chat-messages.ts`, `features/chat/use-chat-runtime.ts`, `hooks/use-agents.ts`, `use-providers.ts`, `use-skills.ts`, `use-skills-sync.ts`, `use-threads.ts`, `use-runs.ts`, `use-health.ts`; also the direct `api.*` calls in `left-sidebar.tsx` and `user-settings-page.tsx` so they read/write through the graph) to `useEntity/useEntityList/useEntityMutation/useEntityCRUD`, preserving invalidation semantics (e.g. skills refresh after sync, thread deletion). Remove `QueryClientProvider`, uninstall `@tanstack/react-query` and unused `@tanstack/react-table@8`. Do not migrate PGlite thread/message storage (deferred).
   - Acceptance: `grep -r "@tanstack/react-query" src package.json` returns nothing; unit tests for each migrated hook against a mocked `fetch` (list, detail, create/update/delete, invalidation after skills sync); skills-sync integration test still passes/skips; manual smoke against UAR (agents, providers, skills, threads CRUD) recorded in the change's verification notes.

4. shadcn-base-ui-migration: Reinstall shadcn primitives on Base UI at the latest shadcn
   - Scope: src/components/ui/*, every consumer of overlay/menu/select primitives, components.json
   - Depends on: tailwind-v4-foundation
   - Recommended agent: Claude Code
   - Est. complexity: L
   - Complexity score: High
   - Model class: frontier
   - Customer value: MEDIUM
   - Details: Set `components.json` to a `base-<style>` style (Tailwind 4 layout, no `tailwind.config`), then re-add only the primitives actually imported by the app with `npx shadcn@4.21.0 add … --overwrite`; delete unused primitives. Update call sites per the shadcn `migrate-radix-to-base` mapping (`asChild` → `render`, `onOpenChange(open, details)`, dismiss callbacks → `details.reason`/`cancel()`, `data-state` selectors → `data-open/closed`). Remove `@radix-ui/*` dependencies that are no longer referenced. Mount a real theme provider for `sonner` (or drop the duplicate shadcn `Toaster` so one toast system remains).
   - Acceptance: `components.json` style starts with `base-`; `grep -r "@radix-ui" src package.json` returns nothing (or only a documented exception with reason); build/typecheck/lint/tests pass; keyboard walkthrough of dialog, alert-dialog, dropdown, select, popover, tooltip, sheet/drawer, tabs verified (focus trap, Esc, outside click) and noted.

5. assistant-ui-latest: Upgrade assistant-ui to 0.15.x on the Base UI registry
   - Scope: chat runtime + src/components/assistant-ui/*, features/chat
   - Depends on: shadcn-base-ui-migration
   - Recommended agent: Claude Code
   - Est. complexity: L
   - Complexity score: High
   - Model class: frontier
   - Customer value: HIGH (chat is the core surface)
   - Details: Run `npx assistant-ui@latest upgrade` codemods; bump `@assistant-ui/react`, `react-markdown`, `react-devtools`; add the `@assistant-ui` style-aware registry to `components.json` and re-pull the thread/markdown/tool-fallback/attachment components as Base UI variants, then re-apply the KnowMe-specific behavior from `enhanced-thread.tsx` / `enhanced-markdown-text.tsx` (welcome state, rich content blocks, KaTeX, Shiki, Mermaid routing). Delete the dead assistant-ui/chat components identified in the assessment (`thread.tsx`, `markdown-text.tsx`, `tool-fallback.tsx`, `assistant-modal.tsx`, `assistant-sidebar.tsx`, `thread-list.tsx`, `components/chat/*`) unless the re-pulled registry versions replace them. Keep `useExternalStoreRuntime` adapter contract (metadata on every message, `attachments: []`).
   - Acceptance: package versions at latest 0.15.x/0.14.x/1.2.x; a scripted SSE fixture (from change 2's mock, or a vitest harness) renders text, thinking, tool call, citation, memory, skill activation, artifact and A2UI blocks without runtime errors; existing thread history from PGlite loads; build/typecheck/lint/tests pass.

6. knowme-brand-tokens: Port the KnowMe token system (Flat 2.0) into Tailwind 4
   - Scope: src/index.css (or src/styles/tokens.css), theme mechanics, third-party theming
   - Depends on: tailwind-v4-foundation, shadcn-base-ui-migration
   - Recommended agent: Claude Code
   - Est. complexity: M
   - Complexity score: Medium
   - Model class: medium
   - Customer value: HIGH
   - Details: Port S3's `@theme` + shadcn variable mapping with S1 values: canvas/chrome/surface/raised/hover/muted ladder, text/secondary/faint, ember/ember-2/ember-soft, cyan, success/warning/error; `--border: transparent` and a base rule neutralising borders, shadcn/assistant-ui shadow kill rules; radius scale (4/6/10/16/24/pill), spacing on 4px base, motion tokens (150/250/350ms, `cubic-bezier(.23,1,.32,1)` / `(.55,0,1,.45)`, reduced-motion); font weights per brand import; type roles with a 12px floor. Apply D-007 text-safe variants and document each measured ratio in comments. Replace stock `--sidebar-*` HSL values. Persist theme choice (dark default) and apply the appearance-page font-size setting. Theme mermaid (re-init on theme change), Shiki (brand code backgrounds #0A1220 / #F0F2F5), sonner. Do not delete S3's Geist leftover into this repo (skip `--font-sans: 'Geist Variable'`).
   - Acceptance: token pairs in D-007 measured ≥4.5:1 (text) / ≥3:1 (large text, control boundaries) by a unit test that parses the token file; no `hsl(` sidebar stock values remain; theme persists across reload; axe color-contrast passes on the landing page and one app route in both themes (via change 2 harness).

7. knowme-brand-identity: Logo, icons, metadata, naming and copy
   - Scope: new Logo/Wordmark components, public/, index.html, src-tauri config + icons, copy strings, README
   - Depends on: knowme-brand-tokens
   - Recommended agent: Claude Code
   - Est. complexity: M
   - Complexity score: Medium
   - Model class: medium
   - Customer value: HIGH
   - Details: Port `KnowMeLogo` / `KnowMeWordmark` ("Know" + ember "Me", Space Grotesk) from S3 into `src/components/brand/`, using the Conviction geometry from `branding/logos/conviction-*.svg`; honour clear-space, min sizes (16/24/52px), no glow/shadow, no all-ember mark in chrome. Generate favicon set (SVG + 32px ICO + apple-touch) and a self-hosted `og-image.png` (1200×630) replacing the expiring Lovable URL; regenerate `src-tauri/icons/*` from `desktop/branding/app-icon-source.svg` with `cargo tauri icon`; set Tauri `productName`/window title "KnowMe" and fix `devUrl`/`beforeDevCommand` to the Vite port 8080 with npm. Update index.html title/description/og tags with an approved tagline ("AI that understands you."). Copy: remove "Charcoal" (skills-page "built-in skill of the KnowMe agent"), frame UAR as "Universal Agent Runtime" instance hosting the KnowMe agent (D-004), legal line "© 2026 KnowMe AI, LLC" (D-001), voice rules (no banned words, no exclamation marks). Rewrite README (drop Lovable boilerplate), remove `lovable-tagger` and `public/placeholder.svg`, update CLAUDE.md "Charcoal Agent" wording.
   - Acceptance: `grep -rniI "charcoal" --exclude-dir=node_modules --exclude-dir=dist --exclude-dir=.git --exclude-dir=target --exclude-dir=.kbd-orchestrator --exclude-dir=openspec --exclude=bun.lockb .` returns only D-005 internal identifiers (`CharcoalDb`, `charcoal-db`, `charcoal:` / `charcoal-` storage keys) — `package-lock.json` is included, and after removing `lovable-tagger` it must contain neither `charcoal` nor `lovable`; filenames are checked separately with `find . -iname '*charcoal*' -not -path './node_modules/*' -not -path './.git/*'`, whose only allowed hit is `charcoal-agent.code-workspace` (D-005) — this covers `src/`, `index.html`, `public/`, `src-tauri/` (tauri.conf.json productName/title, Cargo.toml), `package.json`, `README.md`, `CLAUDE.md`, `docker-compose.yaml`, `nginx.conf`; the same repo-wide grep for `lovable|gpt-engineer` returns nothing; `src-tauri/Cargo.toml` package description/authors no longer "A Tauri App"/"you"; no external og:image URL; favicon and Tauri icons render the Conviction mark; `npm run tauri:dev` launches against port 8080 (or documented as not run if cargo-tauri absent).

8. app-shell-flat2: Restyle the application shell
   - Scope: components/layout/* (app-layout, topbar, left-sidebar, right-context-panel, mobile-nav, mobile-sidebar-drawer), common/*
   - Depends on: knowme-brand-tokens, knowme-brand-identity
   - Recommended agent: Claude Code
   - Est. complexity: M
   - Complexity score: Medium
   - Model class: medium
   - Customer value: HIGH
   - Details: Apply the surface ladder (canvas main, chrome topbar/sidebar/bottom nav, surface panels), nav lockup (28px mark + 18px wordmark), active destination = ember-tinted fill + stronger text, hover = hover token, focus = high-contrast fill + visible cue. Remove all borders/dividers/shadows/backdrop-blur and the `grid-overlay` texture if it reads as lines. Replace raw palette status dots in `uar-status` with status tokens plus a text/icon cue (no color-only status). Eliminate sub-12px text.
   - Acceptance: `grep -E "\bborder(-[trblxy])?\b|divide-|shadow|backdrop-blur" src/components/layout src/components/common` returns nothing (except `border-transparent`/`border-0`); harness screenshots of `/threads` at all widths × themes reviewed against S1 §3; axe passes.

9. chat-surfaces-flat2: Restyle thread, composer and every content block
   - Scope: enhanced-thread, enhanced-markdown-text, features/chat/components/*, features/artifacts/*
   - Depends on: assistant-ui-latest, knowme-brand-tokens, knowme-brand-identity (welcome state uses the KnowMe mark)
   - Recommended agent: Claude Code
   - Est. complexity: L
   - Complexity score: High
   - Model class: frontier
   - Customer value: HIGH
   - Details: Per S1 chat rules: assistant replies as unbubbled authored prose (Roboto option for long-form), user messages as ember-tinted fill on the trailing edge (replacing zinc-800), composer as a filled surface (no blur), thinking/reasoning and citations on cyan-tinted surfaces, tool calls/memory/skill/context blocks on surface/raised tokens with mono metadata ≥12px, code blocks on brand code backgrounds, artifacts and A2UI cards borderless, HTML-artifact iframe backdrop tokenised, welcome state uses the KnowMe mark instead of SparklesIcon, streaming cursor in cyan. Remove all raw palette classes and hex values.
   - Acceptance: grep for `zinc-|bg-white|#[0-9a-fA-F]{6}` in the chat/artifact files returns nothing; harness SSE fixture screenshots in both themes at 320 and 1440 reviewed; axe passes on a thread with every block type.

10. landing-and-about-brand: Brand-template landing page and About
   - Scope: landing-page, about-page, NotFound
   - Depends on: knowme-brand-identity, knowme-brand-tokens
   - Recommended agent: Claude Code
   - Est. complexity: M
   - Complexity score: Medium
   - Model class: medium
   - Customer value: HIGH
   - Details: Follow S2's brand template rhythm: nav lockup, hero lockup (52–72px mark), mono eyebrow, Space Grotesk display headline with a single ember accent, approved tagline, one ember primary CTA per view, feature sections on alternating surfaces (no card outlines, no gradients), footer lockup with "© KnowMe AI, LLC". About page: product/runtime explanation per D-004 and version info. Copy follows brand voice.
   - Acceptance: landing uses only approved taglines; exactly one ember-filled CTA per viewport section; screenshots at 4 widths × 2 themes; no horizontal scroll at 320px.

11. app-pages-flat2-entity-views: Restyle app pages and adopt entity list/detail components
   - Scope: threads, agents, agent-detail, settings (providers, skills, appearance, account) pages
   - Depends on: entity-graph-data-layer, knowme-brand-tokens, app-shell-flat2
   - Recommended agent: Claude Code
   - Est. complexity: L
   - Complexity score: High
   - Model class: frontier
   - Customer value: HIGH
   - Details: Restyle every page to Flat 2.0 (filled inputs, surface-grouped sections, row-background tables). Where a page is a list/detail of an entity already migrated in change 3 (agents, providers, skills), use the package's `EntityListView`/`EntityTable`/`EntityDetailSheet`/`EntityFormSheet` if they can be themed via tokens without forking; otherwise keep existing components and record why. Replace raw palette classes (skills-page 11, agents-page 4) with status tokens + text cues; remove sub-12px arbitrary sizes. Settings copy per D-004.
   - Acceptance: grep for raw Tailwind palette classes (`(bg|text|ring|border)-(zinc|slate|gray|green|amber|blue|purple|red|orange)-[0-9]`) across src/pages returns nothing; each adopted entity component renders in both themes without borders (screenshot); CRUD on agents/providers/skills still works against the mock and a live UAR smoke.

12. brand-fidelity-audit: Whole-site verification and golden snapshots
   - Scope: verification, small fix-ups only
   - Depends on: all of 1–11
   - Recommended agent: Claude Code (+ Manual review by operator)
   - Est. complexity: M
   - Complexity score: Medium
   - Model class: medium
   - Customer value: HIGH
   - Details: Run the harness across all routes × 320/768/1024/1440 × dark/light; run axe; run Flat 2.0 greps repo-wide (including `components/ui`); compare screenshots side by side with S2/S3 references; fix residual deviations; commit golden snapshots; Lighthouse on landing and thread routes (record, not gate, bundle size — see deferred). Operator sign-off on brand fidelity.
   - Acceptance: every blocking check in `.kbd-orchestrator/constraints.md` re-run and recorded with output: `git ls-files` env-file check, `console.log` grep, `: any` grep (count ≤ 1 baseline), secrets grep, `@electric-sql/pglite` still in `optimizeDeps.exclude`, PGlite MIGRATIONS entries unchanged (`git diff main -- src/lib/db/pglite.ts` shows only appended migrations, if any), no writes to reference folders; zero axe color-contrast violations; zero border/shadow/gradient hits outside documented exceptions; build/typecheck/lint/unit/e2e all green; golden snapshots committed; operator approval recorded in the change.

## EXECUTION ROUND ORDER
Round 1 (parallel): tailwind-v4-foundation, visual-verification-harness, entity-graph-data-layer
Round 2: shadcn-base-ui-migration
Round 3 (parallel): assistant-ui-latest, knowme-brand-tokens
Round 4: knowme-brand-identity
Round 5 (parallel): app-shell-flat2, chat-surfaces-flat2, landing-and-about-brand
Round 6: app-pages-flat2-entity-views
Round 7: brand-fidelity-audit

Parallel-work note: rounds 1, 3 and 5 all edit `package.json`/lockfile or shared CSS; run them in separate worktrees and merge sequentially, rebasing the lockfile each time.

## TRADE-OFFS, CUTS AND DEFERRED WORK
- Goal traceability: changes 3, 4 and 5 serve goal 8 (operator-added 2026-09-23, recorded in goals.md and D-003/D-006), not the original branding goals. They stay in this phase because the operator requested them and because restyling Radix/TanStack-era components before replacing them would duplicate work; change 3 has no styling dependency and could be split into its own phase without affecting the others if schedule pressure requires.
- The operator's added scope (Base UI migration, assistant-ui upgrade, entity-graph adoption) is infrastructure, not branding; it adds 3 of the 12 changes (≈ 3 L-sized sessions) and is the main schedule risk. It is sequenced first because restyling Radix/TanStack-era components and then replacing them would do the work twice.
- Not in this phase: renaming internal `charcoal-*` storage/identifiers or the repo directory (D-005); migrating PGlite thread/message storage onto the entity graph's persistence adapter; bundle-size reduction (main chunk 2.15 MB vs 300 kB budget); Flutter/desktop apps; updating the upstream brand docs to "KnowMe AI, LLC".
- The KBD project name in `.kbd-orchestrator/project.json` is still "Charcoal Agent"; rename via `/kbd-init --force "KnowMe"` after this phase if wanted (only kbd-init writes that file).
- Entity components may not be fully themeable without forking; change 11 allows falling back to existing components with a recorded reason rather than forking the package.
- Risk: Base UI and assistant-ui 0.15 are both breaking upgrades landing in consecutive rounds; if change 5's codemods fail badly, fall back to re-scaffolding the thread from the registry and porting only the custom blocks.

## COMMANDS TO RUN
/opsx:new tailwind-v4-foundation
/opsx:new visual-verification-harness
/opsx:new entity-graph-data-layer
/opsx:new shadcn-base-ui-migration
/opsx:new assistant-ui-latest
/opsx:new knowme-brand-tokens
/opsx:new knowme-brand-identity
/opsx:new app-shell-flat2
/opsx:new chat-surfaces-flat2
/opsx:new landing-and-about-brand
/opsx:new app-pages-flat2-entity-views
/opsx:new brand-fidelity-audit

PLAN COMPLETE

## Adversarial review (round 1 → revised)
- Judge gpt-5.5 (verified-distinct). BLOCK: 1 CRITICAL, 2 WARNING.
- CRITICAL naming acceptance too narrow: fixed — change 7 acceptance is now a repo-wide grep with explicit exclusions and an allow-list of D-005 identifiers.
- WARNING chat-surfaces missing identity dependency: fixed — added; round order unchanged (both already after round 4).
- WARNING entity-graph not tied to a branding goal: addressed — operator-added goal 8 recorded in goals.md; split-out option documented. Carried to handoff.

## Adversarial review (round 2 → revised, max rounds reached)
- BLOCK: 1 CRITICAL, 2 WARNING.
- CRITICAL constraint verification missing: fixed — change 12 acceptance now re-runs every blocking check from constraints.md (each change is also gated by constraints.md during /kbd-execute).
- WARNING lockfile excluded from naming grep: fixed — lockfile included (currently 0 hits for charcoal/lovable except via lovable-tagger, which change 7 removes).
- WARNING filename rebrand untestable by grep: fixed — separate `find` check with allow-list.
- Round cap reached; round-2 revisions were not re-reviewed by the judge. No unresolved findings.

## Findings from execution (routed to later changes)
Source: `openspec/changes/archive/2026-09-23-visual-verification-harness/verification.md`.
- **assistant-ui-latest:** re-pulled `attachment.tsx` must give the attachment tile trigger real button semantics/keyboard activation (review warning from shadcn-base-ui-migration).
- **assistant-ui-latest:** stream events that arrive before the first text/thinking delta (skill activation, context update, memory recall, tool calls) are silently dropped by `chat-message-store` — create the assistant message on `agui.stream.start` (or on any first block) and add a unit test.
- **app-shell-flat2:** at 768px both the threads sidebar and the context panel stay open, collapsing the conversation to ~150px (HIGH); collapse one panel below `lg`.
- **chat-surfaces-flat2:** light-theme user bubble unreadable (`bg-zinc-800`); context-update block overflows and tool names truncate at 320px; A2UI input shows "Response captured" before any response; mermaid artifacts render as source text.
- **app-pages-flat2-entity-views:** skills page overflows horizontally at 320px (cards and Sync button clipped); `nested-interactive` axe violations on settings/skills.
- **landing-and-about-brand:** unnamed button on landing (`button-name`, critical).
- **All restyle changes:** baseline `color-contrast` violations on 14 of 24 page/theme scans (74 nodes); `npm run test:a11y` report is the tracking source; brand-fidelity-audit runs `AXE_STRICT=1`.
