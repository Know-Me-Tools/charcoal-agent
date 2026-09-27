ASSESSMENT: complete-rebranding
Project: Charcoal Agent
Date: 2026-09-23
Codebase baseline: React 19 + Vite 7 + Tailwind 3.4 + shadcn/ui chat client that already borrows KnowMe's anchor colors (#E04E28 / #FF6A3D / #0B0F14) and the four brand fonts, but has no logo, uses stock shadcn bordered/shadowed components, and does not follow the binding Flat 2.0 product standard.
Cross-tool progress: none

## Brand source of truth (resolved during assessment)

The request names `know-me-system/docs`. Research found the brand is split across three sources with a clear precedence:

| Precedence | Source | Governs |
|---|---|---|
| 1 | `/Users/gqadonis/Projects/know-me/know-me-system/docs/knowme-ui-ux-standard.md` (30.6 KB, verified present) ("Binding product-design standard", 2026-07-17) | **All app UI**: Flat 2.0 (no borders/dividers/shadows/gradients), 4-level surface ladder, semantic color table, cyan AI accent, type roles, spacing base 4px, motion |
| 2 | `/Users/gqadonis/Projects/know-me/branding/knowme-brand-guide.html` (Brand Guide v1.0, April 2026; 63 KB, verified present) + `/Users/gqadonis/Projects/know-me/branding/logos/*.svg` (e.g. conviction-light.svg, verified present) | Brand anchors, logo ("Conviction" K mark), lockups, clear-space/min-size/misuse, voice, taglines, type stack & scale |
| 3 | `/Users/gqadonis/Projects/know-me/know-me-system/desktop/src/index.css`, `/Users/gqadonis/Projects/know-me/know-me-system/desktop/src/shared/components/KnowMeLogo.tsx`, `/Users/gqadonis/Projects/know-me/know-me-system/desktop/branding/app-icon-source.svg` (all verified present) | Reference implementation (Tailwind v4 + shadcn) of #1 and #2 — portable tokens and logo component |
| — | `/Users/gqadonis/Projects/know-me/know-me-system/docs/design/*.html` (IAM prototypes, 2026-09-19) | Newest, but use borders/shadows and a purple warning — **superseded by #1** for app UI per standard §1 |

All brand sources are **outside this repository** (sibling directories under `/Users/gqadonis/Projects/know-me/`); existence was verified with `ls` on 2026-09-23. Tools that resolve only repo-relative paths will report them missing — they are read-only references, not repo files. Note: `branding/` lives outside `know-me-system/docs`; the brand guide is cited by `docs/design/index.html` L56-58, and this repo's `docs/xhtml-docs/*.html` are byte-identical copies of `branding/logos/` sources.

## IMPLEMENTATION STATUS

- Color tokens (src/index.css, tailwind.config.ts): PARTIAL — primary/ring already brand ember (224 78 40 light, 255 106 61 dark), bg/fg match canvas/text. Missing: 4-level surface ladder (chrome #111620/#FFFFFF, surface #161D29/#FAFBFC, raised #1C2535, hover #202B40/#F2F4F7, muted #253044/#EEF0F3), cyan AI accent (#00C2DC/#0891B2), faint text (#6B7280), ember-soft. Current dark card #0F1620 / border #233041 follow the older brand-guide ramp, not the standard. `--border` is visible (standard requires transparent). `--sidebar-*` still stock shadcn HSL (dark sidebar-primary is blue); tailwind sidebar block defines primary-foreground/accent-foreground twice (hsl wins).
- Flat 2.0 compliance: MISSING — ~308 border/divide/ring/outline class uses outside `components/ui`, 101 inside shadcn primitives, 50 `shadow*` uses, 3 gradient/backdrop-blur, 14 files using `<hr>`/`Separator`. Composer is a blurred rounded-2xl card; mobile drawer uses blur backdrop (glassmorphism is prohibited).
- Typography: PARTIAL — Space Grotesk / Inter / Roboto / JetBrains Mono already loaded from Google Fonts (index.html L13-15) and mapped in Tailwind (display/ui/body/mono). Gaps: weights differ from brand import (missing Inter 300/800, Roboto 300/700, Space Grotesk 400, Mono 600); pervasive `text-[10px]`/`text-[11px]` violates "nothing below 12px" (≥100 arbitrary sizes across enhanced-thread 17, agents-page 16, user-settings 12, left-sidebar 12, memory-block 10…); no fluid type scale; `@tailwindcss/typography` installed but not registered though `prose-sm` is used (enhanced-markdown-text.tsx:255).
- Logo & marks: MISSING — no logo component or SVG anywhere; wordmark is plain text in topbar.tsx:29, landing-page.tsx:88/181, mobile-sidebar-drawer.tsx:37, about-page.tsx:16; chat welcome uses a Lucide SparklesIcon as "brand mark" (enhanced-thread.tsx:105-117). Wordmark lacks ember "Me".
- Favicon / app icons / social: MISSING — `public/favicon.ico` is Lovable default, `public/placeholder.svg` Lovable; og:image/twitter:image point to an **expiring** Lovable storage URL (index.html L20-21, Expires=1771502234); `src-tauri/icons/*` (16 files) are default Tauri icons; brand-source `app-icon-source.svg` exists in know-me-system/desktop.
- Naming & copy: PARTIAL — "KnowMe" spelled correctly in UI; title "KnowMe — AI Agent Runtime". Off-brand: "synced from the Charcoal Agent" (skills-page.tsx:168), infrastructure jargon "UAR"/"Universal Agent Runtime" in user-visible copy (about-page 27/34/40, uar-status 40, skills-page ×8, agents-page 293, user-settings 267) — conflicts with standard's "not an infrastructure console". Hero copy ("An OS that learns you", "AI that knows you.") is not an approved tagline (primary: "AI that understands you."). Tauri productName "know-me", Cargo package "app", README is Lovable boilerplate, `lovable-tagger` in vite config.
- Right context panel (`src/components/layout/right-context-panel.tsx`, 98 lines): STUB — 9 `border` uses (panel edge + section rules), `bg-card`/`bg-muted` without a chrome/surface distinction, one `text-[10px]` label; needs chrome-token background and surface-ladder sections per Flat 2.0.
- Brand templates: PARTIAL relevance — `/Users/gqadonis/Projects/know-me/branding/knowme-brand-template.html` (38.6 KB, "KnowMe — [Document Title]") is a document/page template for branded collateral; it is the pattern to follow for the landing page and marketing-style surfaces (nav lockup, eyebrow + display heading rhythm, footer), not for in-app chat surfaces, which follow the UI/UX standard. No other templates found in `know-me-system/docs`.
- Surfaces restyle: STUB — all pages/layout use tokens but with bordered cards and stock shadcn look. Heaviest custom surfaces: enhanced-thread.tsx (76 classNames, zinc-800 user bubble that breaks light mode — standard wants ember-tinted user fill, unbubbled assistant prose, cyan-tinted thinking panel), skills-page (11 raw palette classes: green/amber/purple/blue), agents-page, providers-page, user-settings-page, left-sidebar, a2ui-artifact-block, tool-call/thinking/memory/citation blocks.
- Third-party theming: PARTIAL — mermaid has 8 hardcoded hex pairs that duplicate theme values and a singleton init that never re-themes on toggle (mermaid-block.tsx:29-45); Shiki uses github-dark-dimmed/github-light (no brand code-bg #0A1220/#F0F2F5); sonner reads next-themes `useTheme()` but no ThemeProvider is mounted (always "system"); both shadcn Toaster and Sonner mounted.
- Theme mechanics: PARTIAL — dark is default (correct per brand), but theme choice is not persisted (ui-store.ts, index.html hard-codes `class="dark"`), appearance-page font-size setting is stored but never applied.
- Motion: PARTIAL — `.transition-panel/.transition-hover` utilities exist; no brand easing tokens (`cubic-bezier(.23,1,.32,1)`), no durations 150/250/350, no reduced-motion handling found.
- Visual verification: MISSING — no Playwright/Storybook/screenshot tests; only vitest jsdom.

## WCAG CONTRAST AUDIT (computed, WCAG 2.x relative luminance)

| Ratio | Pair | Verdict |
|---:|---|---|
| 16.33 | current dark fg #E8EDF3 on bg #0B0F14 | AA pass |
| 8.29 | current dark muted-fg #A7B0BC on card #0F1620 | AA pass |
| 7.06 | current light muted-fg #4B5563 on bg #F7F7F8 | AA pass |
| **3.97** | current light **white on primary #E04E28** (all light-mode primary buttons) | **FAIL** normal text (large-text only) |
| 6.76 | current dark #0B0F14 on primary #FF6A3D | AA pass |
| **3.71** | current light **ember #E04E28 as text** on #F7F7F8 (`text-primary`, `.section-label`) | **FAIL** normal text |
| **3.98** | standard faint #6B7280 on dark canvas | **FAIL** normal text |
| **3.18** | standard faint #6B7280 on dark raised #1C2535 | **FAIL** normal text |
| 4.52 | standard faint #6B7280 on light canvas | AA pass (barely) |
| 6.04 | standard secondary #A7B0BC on dark muted #253044 | AA pass |
| 8.92 | standard cyan #00C2DC on dark canvas | AA pass |
| **3.44** | standard cyan #0891B2 on light canvas | **FAIL** normal text |
| **2.98** | standard warning #D97706 on light canvas | **FAIL** (also < 3:1 non-text) |
| **3.08** | standard success #16A34A on light canvas | **FAIL** normal text |
| 5.28 | white on ember-2 #C13E1E | AA pass — viable light primary-button fill |
| **1.06 / 1.07** | adjacent Flat 2.0 surfaces canvas↔chrome (dark / light) | below 3:1 non-text (WCAG 1.4.11) — acceptable only where the boundary is not needed to identify a control; inputs/buttons need another cue |

Findings: the **current** app already fails AA on light-mode primary buttons and ember text. The **standard's** palette, applied verbatim, adds failures for faint text on dark, and cyan/warning/success used as light-mode text. The plan must define text-safe variants (e.g. darker light-mode cyan/amber/green for text, ember-2 or charcoal on ember for buttons) and must not rely on surface-color changes alone to mark interactive control boundaries (standard §3.2 already requires an extra focus cue). Contrast was computed for token pairs only; rendered-surface auditing (axe/Lighthouse) remains a plan task.

## CROSS-TOOL PROGRESS
NONE — no cross-tool activity recorded (progress.json changes: []).

## SPEC GAP SUMMARY
- No OpenSpec specs exist (`openspec/specs/` empty); the brand documents above are the de-facto spec for this phase.
- Flat 2.0 is the dominant gap by volume (~460 border/shadow sites). Doing it per-component is expensive; the reference implementation neutralises it globally (`--border: transparent`, `* { border-color: transparent }`, assistant-ui shadow kill rules) — but global neutralisation alone leaves regions undifferentiated, so the surface ladder must be applied per surface.
- Tailwind v4-only syntax is silently dropped under Tailwind 3.4: `max-w-(--thread-max-width)` (10 sites in enhanced-thread/thread), `wrap-break-word` (4), `duration-(--animation-duration)` (3), trailing `!` (2). Chat column width is currently unconstrained as a result. The brand reference implementation is Tailwind v4 — a v4 upgrade is a plan-level decision (it would make the desktop token file directly portable and fix these).
- Dead code inflates restyle scope: `components/assistant-ui/{thread,markdown-text,tool-fallback,assistant-modal,assistant-sidebar,thread-list}.tsx` and `components/chat/*` appear unreferenced by live routes; `src/App.css` is unimported Vite boilerplate.
- Unplanned scope risk: renaming internal identifiers (`CharcoalDb`, `idb://charcoal-db`, `charcoal:*` localStorage keys, `X-UAR-Session-ID`, `/api/uar/*`) would wipe users' local threads or break the UAR contract — must be out of scope for a visual rebrand.

## BUILD HEALTH
- build check: PASS — `npm run build` (warning: main chunk 2.15 MB / 567 kB gzip, above 500 kB; exceeds the 300 kB app-page JS budget in user rules — pre-existing, not a rebrand goal)
- tests: PASS — `npm test` 2 files / 12 tests (integration suite self-skipped; UAR at https://uar.know-me.tools unreachable)
- lint: FAIL (pre-existing) — `npm run lint` 5 errors / 6 warnings: missing `import/no-extraneous-dependencies` rule definition (vite.config.ts:5), setState-in-effect, no-case-declarations, impure call during render, require() import
- typecheck: FAIL (pre-existing) — `tsc --noEmit -p tsconfig.app.json`: 1 error, `orientation` prop on ScrollArea (settings-page.tsx:34). Vite build does not type-check, so this is invisible to `npm run build`.
- known violations: see CONSTRAINT CHECK
- test coverage: MINIMAL — one placeholder unit test; no component or visual tests

## CONSTRAINT CHECK
- AGENTS.md violations: N/A (no project AGENTS.md)
- constraints.md violations:
  - no-console-log-in-commits: NONE (0 hits)
  - no-any-type: 1 pre-existing baseline occurrence
  - no-lint-warnings (warning): FAIL — 5 errors / 6 warnings pre-existing
  - shadcn-components (warning): mostly compliant
  - pglite-not-prebundled: PASS
  - build-passes / tests-pass: PASS
  - no-env-files-committed (blocking): PASS — `git ls-files` tracks only `.env.example`; `.env` and `.env.development.local` exist on disk but are ignored (.gitignore:34, :36)

## GOAL PROGRESS
1. Adopt official brand as single source of truth: PARTIAL — sources located and precedence resolved (above); not yet encoded in repo (no tokens file, no brand doc link, no logo assets copied).
2. Replace color system with KnowMe palette (light+dark): PARTIAL — anchors correct; surface ladder, cyan, faint text, transparent borders, sidebar tokens, status colors (#22C55E/#16A34A etc. vs current 22 163 74 light ≈ #16A34A ✓, dark 34 197 94 = #22C55E ✓; warning dark 245 158 11 ✓; error dark 239 68 68 ✓) mostly present — the gap is the surface model, not the anchors.
3. Adopt KnowMe typography: PARTIAL — families correct; weights, sub-12px sizes, type scale, prose plugin outstanding.
4. Replace logos, favicon, app icons, naming: NOT MET — no marks anywhere; Lovable favicon/og-image; default Tauri icons; off-brand copy.
5. Restyle every surface to KnowMe look-and-feel: NOT MET — Flat 2.0 not applied; chat surfaces (user bubble, thinking panel, composer) diverge from standard §chat.
6. Retheme shadcn/assistant-ui via tokens: NOT MET — shadcn primitives still stock border/shadow/bg-black overlays; `components.json` baseColor slate.
7. Verify brand fidelity visually + keep build/tests/lint/contrast passing: NOT MET — no visual test harness; lint and tsc already failing before any change; contrast already failing on light primary buttons and ember text (see WCAG CONTRAST AUDIT), and verbatim adoption of the standard palette would add 5 more failing pairs.

## RISKS & OPEN QUESTIONS (for analyze/plan)
1. **Legal name**: request says "KnowMe AI, LLC"; every brand source says "KnowMe, LLC". Needs user confirmation before any footer/about/legal copy is changed.
2. **Primary-button text on ember**: brand guide says white; standard's reference CSS and Flutter use #0B0F14 in dark because white on #E04E28 is 3.97:1 (fails AA for normal text). Recommend charcoal text in dark, white only at ≥18.66px bold or use #C13E1E ember-2 in light.
3. **Tailwind 3 → 4 upgrade**: fixes 19 silently broken classes and allows near-direct port of the desktop token file; adds migration risk to shadcn primitives and tailwindcss-animate. Decide before planning token work.
4. **Faint-text value conflict** (#5C6B7A / #8894A0 / #6B7280): standard's #6B7280 measures 3.98:1 on dark canvas and 3.18:1 on dark raised — fails AA; brand guide's dark subtle #5C6B7A is worse. A lighter dark-mode faint (e.g. #8894A0) is needed — deviation from the standard table must be recorded.
5. **Scope of copy changes**: removing "UAR" jargon from settings/about touches developer-facing diagnostics; decide whether settings pages are "product" (brand voice) or "admin" (keep technical terms).
6. **Dead code**: delete vs restyle unused assistant-ui/chat components — deleting shrinks scope materially.
7. Adversarial review could not use a second judge model if preflight is degraded; single-model vet only.

## Sycophancy Review
Self-check applied: assessment surfaces 7 open risks, flags pre-existing lint/tsc failures rather than reporting "build healthy", and rates the codebase NOT MET on 4 of 7 goals despite its existing ember/charcoal palette. No "clearly/obviously" claims.

ASSESSMENT COMPLETE

## Adversarial review (round 1 → revised)
- Judge: gpt-5.5 via rest-gateway (cross_model_check: verified-distinct). Verdict BLOCK (1 CRITICAL, 1 WARNING).
- CRITICAL "brand sources marked MISSING": caused by repo-relative path resolution; sources exist outside the repo. Revised: absolute paths, sizes, and verification date added.
- WARNING "no contrast assessment": revised — WCAG CONTRAST AUDIT section added.

## Adversarial review (round 2 → revised, max rounds reached)
- Verdict BLOCK (1 CRITICAL, 2 WARNING), same judge.
- CRITICAL "no-env-files-committed not checked": resolved — checked, PASS (added to CONSTRAINT CHECK).
- WARNING "templates not analyzed": resolved — brand template located and scoped (IMPLEMENTATION STATUS).
- WARNING "context panel not analyzed": resolved — right-context-panel finding added.
- Round cap (2) reached; no findings remain unresolved. Revisions were factual additions verified by command output, not re-reviewed by the judge.
