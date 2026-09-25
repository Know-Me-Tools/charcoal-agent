## Context

See proposal.md. The binding source is `know-me-system/docs/knowme-ui-ux-standard.md`: §3 (Flat 2.0 rules and the surface ladder), §4.2 (12px type floor), §7.5 (event presentation table) and §7.7 (chat visual treatment). Tokens come from `src/styles/tokens.css`: canvas, chrome, surface, raised, hover, muted-surface, code, ember/ember-soft/ember-text, cyan/cyan-soft/cyan-text, status soft and text variants, and `--km-scrim`. Utilities available: `focus-cue` and the shadcn primitives on Base UI.

These parts are already in place and are not redone here:
- the welcome state uses `KnowMeMark` (knowme-brand-identity)
- assistant-ui is current (assistant-ui-latest)
- the app shell is flat (app-shell-flat2)

**Goals:**
- The chat and artifact files pass an extended Flat 2.0 guard.
- A thread with every block type reads well at 320 and 1440 in both themes and passes axe.
- The four routed defects are fixed:
  - light-theme user bubble contrast
  - 320px overflow and truncation
  - A2UI "Response captured" shown too early
  - Mermaid artifacts shown as source

**Non-goals:**
- the activity/event inspector (§7.5)
- attachment tile semantics (assistant-ui-latest)
- conversation library changes
- new block types or AG-UI parsing changes
- math, audio or video renderers

## Decisions

1. **Surface map (the creative director's `docs/design/chat-surfaces.md` is authoritative and may refine this).**

   | Element | Surface | Text / metadata |
   |---|---|---|
   | Thread background | `bg-canvas` | — |
   | Assistant message | none (canvas) | `font-body` (Roboto), `text-fg`, max ~68ch |
   | User message | `bg-ember-soft`, trailing edge | `text-fg` |
   | Composer | `bg-composer` at rest, `bg-raised` on `focus-within`, ember focus outline on `:focus-visible` | `font-body`; placeholder `text-faint` |
   | Thinking / reasoning | `bg-cyan-soft` | label `text-cyan-text`, mono meta 12px |
   | Citation | `bg-cyan-soft` | index `text-cyan-text`, title `text-fg` |
   | Tool call / result | `bg-surface`, inner I/O `bg-code` | status pill: status soft + status text + label |
   | Memory, skill, context update | `bg-surface` (nested detail `bg-raised`) | mono meta 12px, `text-fg-secondary` |
   | Code block | `bg-code` | language label + named copy button |
   | Artifact / A2UI card | `bg-surface`, header row `bg-raised` | type label mono 12px |
   | HTML preview frame | new `--km-artifact-canvas` token | — |
   | Full-screen artifact overlay | `bg-scrim` | — |
   | Streaming cursor / thinking pulse | `bg-cyan` | — |

   The creative director may reassign rows. The rules are fixed: no borders, and no text below 12px or dimmed by opacity.

2. **De-emphasis comes from tokens, never opacity.** `text-*/70` and `/90` become `text-fg-secondary` or `text-faint`. Both tokens were contrast-tuned in knowme-brand-tokens (faint is 4.5:1 or better on canvas and surface). Opacity-dimmed text is the main source of the chat axe `color-contrast` failures.

3. **HTML artifact canvas token.** Model-authored HTML usually assumes a white document with black default text. Taking the frame background from the theme would make unstyled artifacts unreadable in dark mode. The creative director adds `--km-artifact-canvas` (exposed as `bg-artifact-canvas`), and the preview uses it in place of `bg-white`. The creative director sets its value per theme in the design doc. The expected default is a light document surface in both themes, since the iframe content is the author's document, not KnowMe chrome. This keeps colour in tokens without changing how artifacts render.

4. **Composer focus.** The textarea sets `outline-none`. The root sets `bg-composer` at rest, `focus-within:bg-raised` on focus and `bg-hover` on drag-over. When the textarea is keyboard-focused, the root draws a 2px ember outline (`has-[:focus-visible]:outline-2 outline-offset-2 outline-ring`). The send and stop buttons keep the global focus ring.

   *Revised in review.* The original plan made the fill change and the caret the only focus cue, and removed the ember outline because §3.3 bans decorative outlines. The measured fill step was about 1.1:1, which is below the 3:1 non-text focus-indicator minimum in WCAG 2.2 SC 1.4.11 and 2.4.7 (artifact-critic finding 5, fixed in `3c24255`). A focus indicator is functional, not decorative, so the outline returns on `:focus-visible` only. At rest there is still no outline, and the composer never has a border, shadow or blur.

5. **A2UI "captured" state.** The label is currently gated on `submitted || status === "complete"`. The tool part's `complete` status only means the request finished streaming. The new gate is `submitted || hasResponse`, where `hasResponse` is true when the tool part carries a result or response payload for this request. Inputs stay enabled until then. The fix is in `a2ui-artifact-block.tsx` and adds no store change.

   *Added in review.* The A2UI submission status is announced: Sending and "Response captured" in a polite `role="status"` region, and send and parse errors as `role="alert"`. This is feedback on the user's own action, so screen-reader users need to hear it. Streamed blocks stay without live roles, so model output does not flood the screen reader (`3c24255`).

6. **Mermaid in artifacts.** `enhanced-markdown-text.tsx` routes `language === "mermaid"` to `MermaidBlock`, but `artifact-block.tsx` has no such branch, so it renders Mermaid through `ShikiCodeBlock` as source. This is the likely cause of "Mermaid renders as source text in some cases". The frontend engineer confirms it by reproducing the defect first, then adds the same routing. `MermaidBlock` keeps its error boundary. On failure it shows the source with a plain-language label ("Diagram could not be rendered") and no raw exception text.

7. **320px behaviour.** Tool names and skill names use `wrap-anywhere` / `break-words` instead of `truncate`. Status pills move below the name when space runs out (`flex-wrap`). The context-update block's key/value payload wraps values, and preformatted JSON gets `overflow-x-auto` inside its own box, so the page itself never scrolls sideways. Block containers get `min-w-0` so flex children can shrink.

8. **Guard extension (QA).** `src/test/flat-shell.test.ts` gains a second `describe` over `src/components/assistant-ui/{enhanced-thread,enhanced-markdown-text}.tsx`, `src/features/chat/components/*.tsx` and `src/features/artifacts/*.tsx` (tests excluded). It adds three rules for these files: six-digit hex colours, `bg-white`/`text-white`/`bg-black`, and opacity text (`text-[\w-]+/\d{1,3}`). The shell `describe` keeps its current rules, so this does not break the archived app-shell-flat2. `tooltip-icon-button.tsx` is included. `attachment.tsx` is left out, because it is being re-pulled in assistant-ui-latest.

9. **Ordering.** The design doc comes first. Then three frontend slices, which do not share files so they can run in any order after 1.1. Then the guard and the e2e regressions. Then verification. The frontend tasks self-check with the same grep the guard uses, so each slice is verified before the guard becomes durable.

## Risks / Trade-offs

- **Removing bubbles from assistant replies.** Long multi-block replies may lose visual grouping. Mitigation: the action bar and the spacing rhythm in the design doc mark message boundaries. The 1440 captures are reviewed for this.
- **Shiki themes emit inline colours at runtime.** These are not source hex, so the guard does not see them. The code block forces `bg-code` and ignores the theme background. A mismatch between the syntax palette and `bg-code` would only show in captures.
- **Relaxed guard coverage.** A hand-picked file list can miss a new file. The guard globs the directories rather than listing files, so new chat components are covered automatically.
- **Uncomfortable case.** If the axe delta shows `color-contrast` failures inside the thread that trace to token values rather than component classes, this change cannot fix them within frontend-owned paths. Those go back to the creative director as a token change. The acceptance criterion "axe passes" would then depend on that follow-up, and it will be recorded as unmet rather than waived.
