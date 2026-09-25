# Chat surfaces: design spec

Owner: km-creative-director. Change: `openspec/changes/chat-surfaces-flat2` (task 1.1).
Binding sources: `know-me-system/docs/knowme-ui-ux-standard.md` §3 (Flat 2.0), §4 (identity), §7.5 (event presentation), §7.7 (chat visual treatment), §11 (accessibility).
Consumers: km-frontend-engineer (tasks 2.1 to 2.3), km-qa-engineer (tasks 3.1, 3.2, 4.1).

This document is authoritative for how the thread, composer, streamed blocks and artifacts look and move. Where it names a class, use that class. Where a component needs something this document does not cover, ask km-creative-director. Do not improvise.

Every colour below is a Tailwind name backed by `src/styles/tokens.css`. No hex values, no raw palette classes (`zinc-*`), no opacity modifiers on colours (`text-fg/70`, `bg-primary/10`).

---

## 1. Concept

### 1.1 Directions explored

| Direction | Idea | Verdict |
|---|---|---|
| A. Authored document | Assistant replies read like a page the agent wrote: prose on the canvas, no bubble, a comfortable measure. Structured events sit inside the page as filled inserts. | Chosen as the base. It is what §7.7 asks for and it removes the "endless stack of bubbles". |
| B. Instrument log | Every event (tool, skill, memory, context) is a row in a run log with mono metadata and a status pill, like a flight recorder. | Kept for the event blocks only. As the whole thread it turns a conversation into a console. |
| C. Margin notes | Reasoning and citations hang in a side margin next to the prose they explain. | Rejected. It needs about 1100px to work, collapses to nothing at 320px, and splits one reading order into two. |

### 1.2 Converged direction: "the page and its instruments"

- **The page.** The agent's words are authored prose on `bg-canvas` in the long-form face (Roboto, `font-body`), held to a 68ch measure. Nothing frames them.
- **The instruments.** Everything the agent *did* rather than *said* is a filled insert on the page: cyan inserts for reasoning and sources (the AI annotating itself), neutral `bg-surface` inserts for tools, skills, memory and context, `bg-code` wells for code. Instruments may use the full column width; prose may not.
- **The person.** The user's words are the only ember-tinted fill in the thread, at the trailing edge. Ember stays rare: in a thread it marks "you" and the send action, nothing else.
- **Rhythm instead of bubbles.** A question and its answer sit close together (16px). A new exchange starts after a wider gap (48px). Grouping comes from spacing, not from outlines.

Signature: the cyan streaming mark. While the agent writes, a small cyan dot pulses at the end of the text it is producing, and nowhere else. Cyan means "the AI is working here" throughout: the streaming mark, the thinking pulse, the Running pill.

### 1.3 Surface ladder in the thread

| Level | Token | Used for |
|---|---|---|
| Canvas | `bg-canvas` | Thread background, assistant prose |
| Surface | `bg-surface` | Composer at rest; tool, skill, memory, context, artifact and A2UI cards |
| Raised | `bg-raised` | Composer on focus; card header rows; nested detail inside a card; menus; the scroll-to-bottom button |
| Well | `bg-code` | Code and JSON bodies |
| AI annotation | `bg-cyan-soft` | Thinking, citations |
| Person | `bg-ember-soft` | User message; selected segment in a toggle |
| Interaction | `bg-hover` | Hover on any control; composer drag-over |
| Field | `bg-muted-surface` | Form fields inside A2UI cards; neutral metadata pills; inline code |
| Author's page | `bg-artifact-canvas` | Behind sandboxed HTML previews only |
| Scrim | `bg-scrim` | Behind the full-screen artifact view |

---

## 2. Type roles in the thread

All sizes are rem-based so the Appearance font-size setting scales them. Nothing below 12px (`text-xs`).

| Role | Classes |
|---|---|
| Assistant prose | `font-body text-[0.9375rem] leading-[1.7] text-fg` (15px) |
| User message | `font-body text-[0.9375rem] leading-relaxed text-fg` |
| Prose headings | `font-display font-semibold tracking-tight text-fg`; h1 `text-xl`, h2 `text-lg`, h3 `text-base`, h4 to h6 `text-sm` |
| Block title (tool name, skill name, artifact title, citation source) | tool and skill names `font-mono text-xs font-semibold text-fg`; artifact and A2UI titles `font-display text-base font-semibold text-fg`; citation source `font-ui text-sm font-semibold text-fg` |
| Block body | `font-body text-sm leading-relaxed text-fg-secondary` |
| Block label ("Reasoning", "Memory recalled", "Input", "Result") | `font-ui text-xs font-semibold` in the block's label colour (see §5) |
| Metadata (counts, types, scopes, language, durations) | `font-mono text-xs text-faint` |
| Code | `font-mono text-xs leading-relaxed` |

Rules:
- Drop the `// ` comment prefixes from block labels. They are decoration, and "few words" means the label is the word.
- De-emphasis comes from `text-fg-secondary` or `text-faint`, never from opacity. Both reach 4.5:1 on every surface in both themes (`src/styles/tokens.test.ts`).
- The existing `body-text` utility in `src/index.css` uses px (`text-[15px]`). Do not use it in the thread; use the rem classes above.

---

## 3. Thread and message treatment

### 3.1 Thread root and viewport (`enhanced-thread.tsx`)

| Element | Classes | Notes |
|---|---|---|
| `ThreadPrimitive.Root` | `@container flex h-full flex-col bg-canvas` | Keep `--thread-max-width: 48rem`. |
| `ThreadPrimitive.Viewport` | `relative flex flex-1 flex-col overflow-x-hidden overflow-y-scroll scroll-smooth px-4 pt-6` | `overflow-x-hidden`, not `overflow-x-auto`: the page never scrolls sideways. Only boxes listed in §8 scroll horizontally. |
| `ViewportFooter` | `sticky bottom-0 mx-auto mt-auto flex w-full max-w-(--thread-max-width) flex-col gap-3 bg-canvas pt-3 pb-4 @md:pb-6` | Remove `rounded-t-3xl`: the footer is the canvas continuing, not a shape. |

### 3.2 Spacing rhythm (4px scale)

| Between | Space | How |
|---|---|---|
| Thread top and first message | 24px | viewport `pt-6` |
| User message and the reply to it | 16px | user root `pb-2`, assistant root `pt-2` |
| End of a reply and the next user message | 48px | assistant root `pb-6`, user root `pt-6` |
| Paragraphs and list blocks in prose | 12px | `my-3 first:mt-0 last:mb-0` |
| Prose and a block, or two blocks | 12px | every block root `my-3 first:mt-0 last:mb-0` (margins collapse in block flow) |
| Reply content and its action bar | 4px | action row `mt-1` |
| Inside a block: header to body | 8px | body `pt-2` or `space-y-2` |
| Inside a block: padding | 12px sides, 8px or 12px vertical | `px-3 py-2` for one-line blocks, `p-3` for cards |
| Last message and composer | 12px minimum | footer `pt-3` |

### 3.3 Assistant message

Unbubbled authored prose on the canvas.

| Element | Classes |
|---|---|
| `MessagePrimitive.Root` (assistant) | `mx-auto flex w-full max-w-(--thread-max-width) flex-col px-0 pt-2 pb-6 @md:px-4 fade-in slide-in-from-bottom-1 animate-in duration-150` plus `data-role="assistant"` |
| Row | `flex w-full items-start gap-3` |
| Agent mark (≥ `@md` only) | wrapper `hidden size-8 shrink-0 items-center justify-center rounded-lg bg-surface text-fg @md:flex`, containing `<KnowMeMark size={24} />` with **no `label`** (decorative, so "KnowMe" is not announced once per message) |
| Content column | `min-w-0 flex-1 wrap-break-word font-body text-[0.9375rem] leading-[1.7] text-fg` with **no background, no padding box, no radius, no shadow** |
| Screen-reader prefix | first child of the content column: `<span className="sr-only">Agent:</span>` (replaces the removed visible "Agent" label) |
| Action row | `mt-1 flex items-center gap-1 @md:ms-11` (aligns under the text when the mark is shown) |

Prose measure: the column is up to about 690px wide at 1440, which is too long for prose. Put `max-w-[68ch]` on `p`, `ul`, `ol`, `blockquote` and `h1` to `h6` in the markdown component map. Code, tables, diagrams, artifacts and all blocks use the full column width.

Remove the old `AgentAvatar` ring (`ring-1 ring-primary/30`), fill (`bg-primary/15`) and the 9px "Agent" label.

### 3.4 User message

| Element | Classes |
|---|---|
| `MessagePrimitive.Root` (user) | `mx-auto flex w-full max-w-(--thread-max-width) flex-col items-end px-0 pt-6 pb-2 first:pt-0 @md:px-4 fade-in slide-in-from-bottom-1 animate-in duration-150` plus `data-role="user"` |
| Row | `flex w-full items-start justify-end gap-3` |
| Edit action | stays at the leading side of the fill (`UserActionBar`, `pt-1`) |
| Fill | `min-w-0 max-w-[min(85%,36rem)] rounded-xl rounded-se-sm bg-ember-soft px-4 py-3 font-body text-[0.9375rem] leading-relaxed text-fg wrap-break-word` |
| Links inside the fill | `text-fg underline underline-offset-2` (not ember: ember text on the ember fill reads as noise) |
| Screen-reader prefix | `<span className="sr-only">You:</span>` as the first child of the fill |
| User avatar (≥ `@md` only) | `Avatar` with `hidden size-8 shrink-0 @md:flex`; `AvatarFallback` with `bg-muted-surface text-fg-secondary`, containing `UserIcon` `size-4` with `aria-hidden`. No ring. Remove the 9px "You" label. |
| Branch picker row | `@md:pe-11` |

Radius: `rounded-xl` (16px, the "feature" radius) with the trailing top corner at `rounded-se-sm` (6px). `se` is the logical start-end corner, so it flips correctly in right-to-left layouts.

Contrast: `text-fg` on `bg-ember-soft` is 16.2:1 (light) and 14.1:1 (dark); the pair is in `tokens.test.ts`. This fixes the routed light-theme defect, where the fill was `bg-zinc-800` under light `text-foreground`.

### 3.5 Action bar, branch picker, "more" menu

| Element | Classes |
|---|---|
| `TooltipIconButton` base (`tooltip-icon-button.tsx`) | `size-8 rounded-md p-0 text-fg-secondary hover:bg-hover hover:text-fg focus-cue active:scale-95 [&_svg]:size-4`. The icon is 16px; the target is 32px (WCAG 2.5.8 needs 24px). Keep the `sr-only` tooltip text as the accessible name. |
| Assistant action bar root | `flex gap-1 text-fg-secondary data-floating:absolute data-floating:rounded-md data-floating:bg-raised data-floating:p-1`. No `border`, no `shadow-xs`. |
| "More" trigger open state | `data-[state=open]:bg-hover data-[state=open]:text-fg` |
| "More" menu content | `z-50 min-w-40 overflow-hidden rounded-md bg-raised p-1 text-fg`. No `border`, no `shadow-md`. |
| Menu item | `flex cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-1.5 font-ui text-sm text-fg outline-none data-highlighted:bg-hover hover:bg-hover focus:bg-hover [&_svg]:size-4 [&_svg]:text-fg-secondary` |
| Branch picker | `inline-flex items-center gap-1 font-mono text-xs text-fg-secondary` |
| Tooltip content (composer caching toggle) | `font-mono text-xs` (was 11px) |

### 3.6 Scroll to bottom

`TooltipIconButton` with `variant="ghost"` (not `outline`) and `absolute -top-12 z-10 size-9 self-center rounded-full bg-raised text-fg-secondary hover:bg-hover hover:text-fg disabled:invisible`. It is an opaque raised disc over the thread, no border and no shadow.

### 3.7 Edit composer

Same fill language as the composer (§4): root `ms-auto flex w-full max-w-[85%] flex-col rounded-xl bg-surface focus-within:bg-raised`; textarea `min-h-14 w-full resize-none bg-transparent p-4 font-body text-[0.9375rem] text-fg caret-ember outline-none placeholder:text-faint`. "Cancel" is `variant="ghost"`, "Update" is the default (ember) button.

### 3.8 Message error

Replace the outlined `Alert` look: `Alert` with `border-0 bg-danger-soft text-danger-text rounded-lg px-3 py-2`, an `AlertCircleIcon` `size-4` with `aria-hidden`, and the message in `font-body text-sm text-danger-text`. The text shown is plain language with a recovery ("The reply stopped before it finished. Try again."), never a raw runtime or transport error (§7.7). If `ErrorPrimitive.Message` can carry a raw error, the frontend engineer maps it to plain language first; list any unmappable case for the product owner.

### 3.9 Empty thread (welcome)

The mark comes from `KnowMeMark` (done in knowme-brand-identity). Only the classes change:
- mark tile: `rounded-2xl bg-surface p-4 text-fg` (was `bg-muted/30`)
- "// No threads yet": `font-mono text-xs text-ember-text` (was 11px)
- body: `max-w-sm font-body text-sm leading-relaxed text-fg-secondary`
- "Start a new thread": `font-mono text-xs uppercase tracking-[0.12em] text-faint` (was 10px at 50% opacity)

---

## 4. Composer

A distinct filled surface anchored below the thread. It is never outlined.

### 4.1 Anatomy (`EnhancedComposer`)

| Element | Classes |
|---|---|
| `ComposerPrimitive.Root` | `relative flex w-full flex-col` |
| `AttachmentDropzone` (the visible composer) | `group relative flex w-full flex-col rounded-xl bg-surface px-1 pt-2 transition-hover focus-within:bg-raised data-[dragging=true]:bg-hover` |
| `ComposerPrimitive.Input` | `mb-1 max-h-48 min-h-14 w-full resize-none bg-transparent px-4 py-3 font-body text-[0.9375rem] leading-relaxed text-fg caret-ember outline-none placeholder:text-faint focus-visible:outline-none`. Keep `aria-label="Message input"` as the accessible name; the placeholder is a hint, not the label |
| Drag hint (new child of the dropzone) | `pointer-events-none absolute inset-0 hidden items-center justify-center gap-2 rounded-xl bg-hover font-ui text-sm font-semibold text-fg group-data-[dragging=true]:flex` containing `PaperclipIcon` `size-4` with `aria-hidden` and the text "Drop files to attach" |
| Action row | `mx-2 mb-2 flex items-center justify-between gap-2` |
| Caching toggle | `flex size-8 items-center justify-center rounded-md transition-hover hover:bg-hover focus-cue`; on: `text-ember-text`; off or inherit: `text-fg-secondary hover:text-fg`. Keep its `aria-label`. Add `aria-pressed={isCachingOn}`. |
| Send | default `Button`, `size-8 rounded-full` (ember fill, `text-primary-foreground`); hover `hover:bg-ember-2`. Keeps the global focus ring (it is a discrete control). |
| Stop | default `Button`, `size-8 rounded-full`, `SquareIcon` `size-3 fill-current`, `aria-label="Stop generating"` |

Remove from the dropzone: `border`, `border-input`, `bg-background/80`, `backdrop-blur-xs`, `transition-shadow`, every `has-[textarea:focus-visible]:*` border and ring class, and `data-[dragging=true]:border-*`. Remove `focus-visible:ring-0` from the textarea (replaced by `outline-none`).

### 4.2 States

| State | Trigger | Fill | Other cues |
|---|---|---|---|
| Rest | nothing focused | `bg-surface` | placeholder `text-faint` |
| Hover | pointer over, not focused | `bg-surface` (no change) | none; a field that changes on hover and on focus reads as two states for one thing |
| Focus | textarea focused (mouse or keyboard) | `bg-raised` via `focus-within` | ember caret (`caret-ember`); no outline, no ring |
| Drag-over | files dragged over | `bg-hover` | drag hint with icon and "Drop files to attach" |
| Running | agent streaming | unchanged | Send becomes Stop |
| Disabled | runtime offline (if the app disables the input) | `bg-surface` | textarea `disabled:cursor-not-allowed disabled:text-faint`; the status pill in the top bar says why |

Why focus uses a fill and a caret, not an outline: §3.3 bans decorative outlines and input chrome, and the global ember focus ring on the textarea is what produced the ember box in the shell captures. The caret is ember so it is findable against both fills (ember is 3.97:1 on white, above the 3:1 needed for a non-text cue).

Known weakness: in the light theme `bg-surface` to `bg-raised` is a small luminance step (1.04:1). The caret and the fill together meet the "visible focus" requirement, but the composer's resting anchor on the light canvas is subtle (1.03:1). Task 4.1 reviews this in the light captures at all four widths. If the composer does not read as a distinct surface there, file it to km-creative-director as a token change (a dedicated field token), not a component workaround.

---

## 5. Status pill anatomy

One anatomy for every status in the thread. It matches `src/components/common/uar-status.tsx` (compact) and the fills in `status-badge.tsx`, with one change: an icon replaces `StatusBadge`'s coloured dot, so the state is carried by icon, text and tone together, never by colour alone.

```
[ icon 14px ][ 6px ][ Label ]      rounded-pill, 10px x 4px padding
```

| Part | Classes |
|---|---|
| Pill | `inline-flex shrink-0 items-center gap-1.5 rounded-pill px-2.5 py-1 font-ui text-xs font-semibold leading-none whitespace-nowrap` plus fill and tone below |
| Icon | lucide icon, `size-3.5 shrink-0` with `aria-hidden="true"`, inherits the tone (`text-current`) |
| Label | plain text in sentence case; this is what a screen reader reads |

| State | Fill | Tone | Icon | Label |
|---|---|---|---|---|
| Awaiting input | `bg-warning-soft` | `text-warning-text` | `HourglassIcon` | Awaiting input |
| Running | `bg-cyan-soft` | `text-cyan-text` | `Loader2Icon` with `animate-spin` | Running |
| Completed | `bg-success-soft` | `text-success-text` | `CheckCircle2Icon` | Completed |
| Failed | `bg-danger-soft` | `text-danger-text` | `XCircleIcon` | Failed |
| Sending (A2UI) | `bg-cyan-soft` | `text-cyan-text` | `Loader2Icon` with `animate-spin` | Sending |
| Response captured (A2UI) | `bg-success-soft` | `text-success-text` | `CheckCircle2Icon` | Response captured |
| Memory stored | `bg-success-soft` | `text-success-text` | `PlusCircleIcon` | Stored |
| Memory updated | `bg-muted-surface` | `text-fg-secondary` | `DatabaseIcon` | Updated |
| Memory removed | `bg-danger-soft` | `text-danger-text` | `Trash2Icon` | Removed |

Running uses cyan, not amber: running is the AI working (§4.1), amber means "needs attention".

Tool status mapping from the assistant-ui part status:

| `status.type` | Pill |
|---|---|
| `requires-action` | Awaiting input |
| `running` | Running |
| `complete` | Completed |
| `incomplete` | Failed |

**Metadata pill** (not a status: scope, memory type, selection method, artifact type, language): `inline-flex shrink-0 items-center rounded-pill bg-muted-surface px-2 py-0.5 font-mono text-xs text-fg-secondary`. No icon.

Do not put `role="status"` on pills inside streamed blocks. The message log is already a polite live region, and a live role on every pill would announce each state change mid-stream.

All pill text pairs are in `tokens.test.ts` (status text on its soft fill, `text-fg-secondary` on `bg-muted-surface`).

A shared `StatusPill` component in `src/components/common/` would keep this in one place. That path belongs to the frontend engineer; it is recommended, not required.

---

## 6. Block surface and token map (§7.5)

One row per §7.5 block kind, plus the three kinds this app renders separately (context update, HTML artifact, A2UI). All roots: `my-3 first:mt-0 last:mb-0 min-w-0 overflow-hidden rounded-lg`, no border, no shadow, unless the row says otherwise.

| §7.5 kind | Component | Root surface | Header / label | Body | Metadata and status | Interaction |
|---|---|---|---|---|---|---|
| Text | `EnhancedMarkdownText` in the assistant column | none (`bg-canvas` shows through) | n/a | `font-body text-[0.9375rem] leading-[1.7] text-fg`, prose `max-w-[68ch]` | n/a | links `text-ember-text underline underline-offset-2 hover:text-fg focus-cue`; streaming mark cyan (§7) |
| Thinking | `ReasoningPart` (thread) and `ThinkingBlock` | `bg-cyan-soft` | trigger row: `BrainIcon` + "Reasoning" (or "Thinking" while streaming), `text-cyan-text` | `font-body text-sm leading-relaxed text-fg-secondary whitespace-pre-wrap wrap-break-word` | right side: `font-mono text-xs text-faint` duration or length when the data exists; streaming: three cyan dots | collapsed by default; trigger expands; `aria-expanded` |
| Code | `ShikiCodeBlock` | `bg-code` | header row `bg-raised`: language `font-mono text-xs text-fg-secondary lowercase`, named Copy button | `bg-code` well, `font-mono text-xs leading-relaxed`, scrolls horizontally inside | optional filename in the header, `font-mono text-xs text-fg` | Copy shows "Copy" then "Copied" |
| Citation | `CitationBlock`, `CitationList` | `bg-cyan-soft` | index `[n]` `font-mono text-xs font-semibold text-cyan-text`; source `font-ui text-sm font-semibold text-fg wrap-anywhere` | excerpt `font-body text-sm text-fg-secondary line-clamp-3` | `ExternalLinkIcon` `text-cyan-text` when linked | whole card is the link: `hover:bg-hover focus-cue` |
| Memory | `MemoryRecallBlock`, `MemoryMutationBlock` | `bg-surface`; recalled items `bg-raised` | recall: `BrainCircuitIcon` `text-fg-secondary` + "Memory recalled" `text-fg`; mutation: status pill (Stored / Updated / Removed) | key `font-mono text-xs font-semibold text-fg wrap-anywhere`; value `font-body text-sm text-fg-secondary wrap-break-word` | count `font-mono text-xs text-faint`; scope and type as metadata pills | none in this change (inspection controls are the event inspector, a non-goal) |
| Tool use | `ToolCallBlock` header | `bg-surface` | `WrenchIcon` `text-fg-secondary`, name `font-mono text-xs font-semibold text-fg wrap-anywhere`, status pill | n/a | status pill per §5 | header toggles detail; `aria-expanded` |
| Tool result | `ToolCallBlock` detail | detail panel on the same `bg-surface`; input and result in `bg-code` wells | "Input", "Result" `font-ui text-xs font-semibold text-fg-secondary` | JSON in `ShikiCodeBlock` (`json`); plain text `font-body text-sm text-fg whitespace-pre-wrap wrap-break-word` | failed result: `bg-danger-soft text-danger-text` line with plain-language text | "Waiting for result" `font-mono text-xs text-faint` while running |
| Skill | `SkillActivationBlock` | `bg-surface` | `ZapIcon` `text-fg-secondary`, name `font-mono text-xs font-semibold text-fg wrap-anywhere` | n/a | selection method as metadata pill; status pill Running ("active") or Completed ("complete") | none |
| Context update (AG-UI state delta) | `ContextUpdateBlock` | `bg-surface` | `DatabaseZapIcon` `text-fg-secondary` + "Context managed" `font-ui text-xs font-semibold text-fg-secondary` | strategy and results as wrapped `font-mono text-xs text-faint` items | no pill (it is a fact, not a state) | none; never raw JSON |
| Artifact | `ArtifactBlock` | `bg-surface` | header row `bg-raised`: type icon `text-fg-secondary`, title `font-display text-base font-semibold text-fg wrap-anywhere`, type metadata pill, Copy and Expand icon buttons | collapsed: `font-body text-sm text-fg-secondary` preview; expanded: code in `ShikiCodeBlock`, text `whitespace-pre-wrap` | input request: "Awaiting input" pill | "Show more" `font-ui text-xs font-semibold text-ember-text hover:underline focus-cue` |
| Artifact (HTML) | `HtmlArtifactCard` | `bg-surface`; preview `bg-artifact-canvas` | toolbar `bg-raised`: title, Preview/Code segmented toggle, Copy, Open in new tab, Full screen | iframe on `bg-artifact-canvas` with `scheme-light`; Code view is `ShikiCodeBlock` | n/a | full screen in a `Dialog` on `bg-scrim` (no blur) |
| Artifact (Mermaid) | `MermaidBlock` (markdown and `ArtifactBlock` with `mermaid`) | `bg-surface` | header row `bg-raised`: "Diagram" `font-ui text-xs font-semibold text-fg-secondary`, "Source" toggle and Copy | diagram `p-4`, scrolls horizontally inside | error: `bg-danger-soft` label "Diagram could not be rendered" + source in a `bg-code` well | loading: cyan `Loader2Icon` + "Rendering diagram" |
| Confirmation / input request (A2UI) | `A2uiInputBlock` | `bg-surface` | `PanelTopOpenIcon` `text-cyan-text` + "Input requested" `font-ui text-xs font-semibold text-cyan-text`; artifact type metadata pill | title `font-display text-base font-semibold text-fg`; prompt `font-body text-sm text-fg-secondary`; fields `bg-muted-surface` | status row: Sending / Response captured / plain-language error | primary action ember `Button`; secondary `variant="ghost"` |
| A2UI display | `A2uiDisplayBlock` | `bg-surface`; content `bg-raised` | "Artifact" label `font-ui text-xs font-semibold text-fg-secondary`; type and language metadata pills | `font-body text-sm text-fg-secondary whitespace-pre-wrap wrap-break-word` in a `max-h-64 overflow-y-auto rounded-md bg-raised p-3` box | n/a | content box is focusable when it scrolls (`tabIndex={0} focus-cue`) |
| Image | markdown `img` (add to the component map) | none; `bg-muted-surface` while loading | n/a | `my-3 h-auto max-w-full rounded-lg bg-muted-surface`, `loading="lazy"`, `decoding="async"`, the model's alt text | n/a | open and download actions are follow-up work (see §12) |
| Divider | markdown `hr` | none | n/a | `my-6 h-0 border-0 bg-transparent`: 24px of space and no line | n/a | none |

Label colour rule: cyan blocks (thinking, citation, A2UI request) label in `text-cyan-text`; neutral blocks label in `text-fg-secondary` or `text-fg`; ember appears only on links, the "Show more" action, the caching toggle when on, and primary buttons.

---

## 7. Per-block detail

Class strings are complete; replace the existing ones.

### 7.1 Thinking (`ReasoningPart` in `enhanced-thread.tsx`, and `thinking-block.tsx`)

- Root: `Collapsible` with default `open={false}` (collapsed by default even while streaming; §7.5). Wrap in `div` with `my-3 first:mt-0 last:mb-0 overflow-hidden rounded-lg bg-cyan-soft`. Do not use `Card` (it brings a border and padding).
- Trigger: `Button variant="ghost"` with `flex h-auto w-full items-center justify-start gap-2 whitespace-normal rounded-lg px-3 py-2 text-left hover:bg-hover focus-cue`.
  - `BrainIcon` `size-3.5 shrink-0 text-cyan-text`, `aria-hidden`
  - label `flex-1 font-ui text-xs font-semibold text-cyan-text`: "Thinking" while `status.type === "running"`, otherwise "Reasoning"
  - streaming pulse after the label: three dots, each `size-1 rounded-full bg-cyan animate-shimmer`, delays `[animation-delay:0ms]`, `[animation-delay:150ms]`, `[animation-delay:300ms]`, in an `inline-flex gap-1` with `aria-hidden`
  - `ChevronDownIcon` `size-3.5 shrink-0 text-cyan-text transition-transform duration-(--km-duration-fast) ease-brand-out`, `rotate-180` when open
- Panel: `CollapsibleContent` with `px-3 pb-3 transition-opacity duration-(--km-duration-fast) ease-brand-out data-[starting-style]:opacity-0 data-[ending-style]:opacity-0`. No `Separator`, no `border-t`.
- Text: `font-body text-sm leading-relaxed text-fg-secondary whitespace-pre-wrap wrap-break-word`. When streaming and open, end with the streaming mark (§9).
- Metadata: the reasoning part carries no duration or token count today. Show nothing rather than an invented figure. See §12.

### 7.2 Citation (`citation-block.tsx`)

- Card: `group my-3 first:mt-0 last:mb-0 flex min-w-0 items-start gap-2 rounded-lg bg-cyan-soft px-3 py-2 transition-hover`; when linked add `hover:bg-hover`.
- Link wrapper: `<a className="block rounded-lg focus-cue" …>` with `target="_blank" rel="noopener noreferrer"` and an `sr-only` "(opens in a new tab)".
- `BookOpenIcon` `mt-0.5 size-3.5 shrink-0 text-cyan-text`, `aria-hidden`.
- Title row: `flex min-w-0 flex-wrap items-baseline gap-x-1.5 gap-y-0.5`; index `font-mono text-xs font-semibold text-cyan-text`; source `min-w-0 font-ui text-sm font-semibold text-fg wrap-anywhere` (no `truncate`); `ExternalLinkIcon` `size-3.5 shrink-0 text-cyan-text`.
- Excerpt: `mt-1 line-clamp-3 font-body text-sm leading-snug text-fg-secondary`.
- `CitationList` label: "Sources" in `font-ui text-xs font-semibold uppercase tracking-[0.12em] text-fg-secondary`; list `mt-4 flex flex-col gap-2` (cards inside use `my-0`).

### 7.3 Tool call and result (`tool-call-block.tsx`)

- Root: `my-3 first:mt-0 last:mb-0 min-w-0 overflow-hidden rounded-lg bg-surface`.
- Header: `Button variant="ghost"` with `flex h-auto w-full items-start justify-start gap-2 whitespace-normal rounded-none px-3 py-2.5 text-left hover:bg-hover focus-cue`. `whitespace-normal` matters: the `Button` base sets `whitespace-nowrap`, which is what makes long names overflow at 320px.
  - `WrenchIcon` `mt-0.5 size-3.5 shrink-0 text-fg-secondary`
  - wrap group `flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-1`: name `min-w-0 font-mono text-xs font-semibold text-fg wrap-anywhere`, then the status pill (§5)
  - `ChevronDownIcon` `mt-0.5 size-3.5 shrink-0 text-fg-secondary`, rotates as in §7.1
- Detail: `space-y-3 px-3 pb-3` (no `divide-y`, no `border-t`).
  - section label "Input" / "Result": `mb-1.5 font-ui text-xs font-semibold text-fg-secondary`
  - input: `ShikiCodeBlock` `language="json"`, no size override (drop `text-[11px]`)
  - result: if it parses as JSON, pretty-print it (`JSON.stringify(value, null, 2)`) into `ShikiCodeBlock` `language="json"`; otherwise `font-body text-sm leading-relaxed text-fg whitespace-pre-wrap wrap-break-word`. The wrapper currently stringifies objects onto one line, which is unreadable and overflows.
  - waiting: "Waiting for result" `font-mono text-xs text-faint`
  - failed with a message: `rounded-md bg-danger-soft px-3 py-2 font-body text-sm text-danger-text`, plain language

### 7.4 Memory (`memory-block.tsx`)

Recall:
- Root `my-3 first:mt-0 last:mb-0 min-w-0 overflow-hidden rounded-lg bg-surface`.
- Header `flex flex-wrap items-center gap-x-2 gap-y-1 px-3 pt-2.5 pb-2`: `BrainCircuitIcon` `size-3.5 text-fg-secondary`, "Memory recalled" `font-ui text-xs font-semibold text-fg`, count `ms-auto font-mono text-xs text-faint`.
- Items `ul` with `space-y-1.5 px-3 pb-3` (no `divide-y`); each `li` `rounded-md bg-raised px-2.5 py-2`.
- Item title row `flex min-w-0 flex-wrap items-center gap-1.5`: key `min-w-0 font-mono text-xs font-semibold text-fg wrap-anywhere`; scope and type as metadata pills.
- Value `mt-1 font-body text-sm leading-snug text-fg-secondary wrap-break-word`.

Mutation:
- Root `my-3 first:mt-0 last:mb-0 flex min-w-0 items-start gap-2 rounded-lg bg-surface px-3 py-2`.
- Title row `flex min-w-0 flex-wrap items-center gap-1.5`: memory status pill (§5), then scope and type metadata pills.
- Content `mt-1 line-clamp-3 font-body text-sm leading-snug text-fg-secondary wrap-break-word`.
- Remove the tinted backgrounds and borders per operation; the pill carries the operation.

### 7.5 Skill (`skill-activation-block.tsx`)

- Root `my-3 first:mt-0 last:mb-0 flex min-w-0 items-start gap-2 rounded-lg bg-surface px-3 py-2`.
- `ZapIcon` `mt-0.5 size-3.5 shrink-0 text-fg-secondary` (no pulse; the pill shows activity).
- Wrap group `flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-1`: name `min-w-0 font-mono text-xs font-semibold text-fg wrap-anywhere`; method metadata pill; status pill (Running for `active`, Completed for `complete`) with `ms-auto`.

### 7.6 Context update (`context-update-block.tsx`)

- Root `my-3 first:mt-0 last:mb-0 flex min-w-0 items-start gap-2 rounded-lg bg-surface px-3 py-2`.
- `DatabaseZapIcon` `mt-0.5 size-3.5 shrink-0 text-fg-secondary`.
- Content `flex min-w-0 flex-1 flex-wrap items-baseline gap-x-2 gap-y-1`: "Context managed" `font-ui text-xs font-semibold text-fg-secondary`; then one `span` per fact (strategy, "3 messages compacted", "about 1,200 tokens freed", "summary saved") in `font-mono text-xs text-faint wrap-break-word`. Separate facts with the flex gap, not "·" characters.
- The component shows no JSON today. If a future payload is shown raw, it goes in a `ShikiCodeBlock` well that scrolls inside itself; the block never widens the page.

### 7.7 Code (`shiki-code-block.tsx`)

- Root `group relative my-3 first:mt-0 last:mb-0 min-w-0 overflow-hidden rounded-lg bg-code` (drop `border`).
- Header `flex items-center justify-between gap-2 bg-raised px-3 py-1.5`: language `font-mono text-xs text-fg-secondary lowercase`; Copy button `inline-flex items-center gap-1 rounded-sm px-2 py-1 font-ui text-xs font-semibold text-fg-secondary transition-hover hover:bg-hover hover:text-fg focus-cue` with `CopyIcon`/`CheckIcon` `size-3.5` and the visible text "Copy" / "Copied". Its accessible name comes from the visible text; keep `aria-live="polite"` on the text span so "Copied" is announced once.
- Body (highlighted and fallback alike): `overflow-x-auto bg-code p-3 font-mono text-xs leading-relaxed text-fg [&_pre]:bg-transparent! [&_pre]:p-0!`, plus `tabIndex={0}`, `role="region"`, `aria-label={`${language} code`}` and `focus-cue`, so a keyboard user can scroll it (axe `scrollable-region-focusable`).
- Line numbers: `[&_.line]:before:text-faint` (was 50% opacity).
- Callers must not pass size or border classes (`text-[11px]`, `rounded-none border-none`); they may pass margin only.
- The Shiki theme's own background is always overridden by `bg-code`. Its token colours are not ours; see §12.

### 7.8 Artifact (`artifact-block.tsx`)

- Root `my-3 first:mt-0 last:mb-0 min-w-0 overflow-hidden rounded-lg bg-surface`. No border in either variant.
- Header `flex items-start gap-2 bg-raised px-3 py-2`:
  - type icon `mt-1 size-3.5 shrink-0 text-fg-secondary`
  - text column `min-w-0 flex-1`: title `font-display text-base font-semibold text-fg wrap-anywhere`; below it `mt-1 flex flex-wrap items-center gap-1.5` with the type metadata pill and, for input requests, the "Awaiting input" pill
  - actions `flex shrink-0 items-center gap-1`: Copy and Expand as `TooltipIconButton` (`tooltip="Copy content"`, `tooltip="Expand"`/`"Collapse"`, `aria-expanded`)
- Collapsed body `px-3 pt-2 pb-3 font-body text-sm leading-relaxed text-fg-secondary wrap-break-word`; "Show more" as in §6.
- Expanded body `p-3`: `language === "mermaid"` goes to `MermaidBlock`; other code types to `ShikiCodeBlock`; text `font-body text-sm leading-relaxed text-fg-secondary whitespace-pre-wrap wrap-break-word`.
- Input request note: one line under the body, `px-3 pb-3 font-body text-sm text-fg-secondary`: "The agent is waiting for your answer." Remove the ember band (`border-t border-primary/20 bg-primary/5`).

### 7.9 HTML artifact (`html-artifact-card.tsx`)

- Root `min-w-0 overflow-hidden rounded-lg bg-surface` (drop `border`, `transition-all`, and the `fixed inset-4 z-50 shadow-2xl` expanded mode).
- Toolbar `flex flex-wrap items-center gap-2 bg-raised px-3 py-1.5`:
  - title `min-w-0 flex-1 font-mono text-xs text-fg wrap-anywhere`
  - segmented toggle `inline-flex rounded-md bg-muted-surface p-0.5`; each segment `inline-flex items-center gap-1 rounded-sm px-2 py-1 font-ui text-xs font-semibold text-fg-secondary transition-hover hover:text-fg focus-cue aria-pressed:bg-ember-soft aria-pressed:text-fg` with `aria-pressed`, icons `size-3.5`
  - Copy, Open in new tab and Full screen as `TooltipIconButton` (`size-8`, named)
- Preview: `h-80 bg-artifact-canvas`; `iframe` `block h-full w-full border-0 scheme-light`, same `sandbox` and `title`. `scheme-light` stops the browser painting an opaque canvas when the page is dark and the document is light, so the token is what shows.
- Code view: `ShikiCodeBlock` in a `max-h-96 overflow-y-auto` wrapper.
- Full screen: open a `Dialog` (`src/components/ui/dialog.tsx`, which already uses `bg-scrim` with no blur). `DialogContent` gets `flex h-[calc(100dvh-2rem)] max-w-[calc(100vw-2rem)] flex-col gap-0 overflow-hidden rounded-2xl bg-surface p-0 sm:max-w-[calc(100vw-2rem)]`; inside, the same toolbar (Full screen becomes "Exit full screen") and the preview at `min-h-0 flex-1 bg-artifact-canvas`. Escape and the close button leave full screen; focus returns to the Full screen button. Remove the hand-rolled `backdrop-blur-xs` backdrop.

### 7.10 Mermaid (`mermaid-block.tsx`)

- Root `my-3 first:mt-0 last:mb-0 min-w-0 overflow-hidden rounded-lg bg-surface`.
- Header `flex items-center justify-between gap-2 bg-raised px-3 py-1.5`: "Diagram" `font-ui text-xs font-semibold text-fg-secondary`; "Source" toggle and "Copy" as text buttons in the code-block Copy style (§7.7).
- Diagram `flex justify-center overflow-x-auto bg-surface p-4 [&_svg]:h-auto [&_svg]:max-w-full` with `tabIndex={0} role="region" aria-label="Diagram" focus-cue`.
- Loading: `flex items-center gap-2 font-mono text-xs text-faint` with `Loader2Icon` `size-3.5 animate-spin text-cyan-text` and "Rendering diagram". Replace the border-drawn spinner (`border-2 border-t-primary`).
- Failure: a label row `flex items-center gap-2 rounded-md bg-danger-soft px-3 py-2 font-ui text-sm font-semibold text-danger-text` with `AlertTriangleIcon` `size-4` and "Diagram could not be rendered", then the source in a `ShikiCodeBlock` (`language="text"`). No raw exception text, no `text-[10px]` detail line.
- Both the markdown path and the artifact path use this component.

### 7.11 A2UI input (`a2ui-artifact-block.tsx`, `A2uiInputBlock`)

- Root: plain `div` (not `Card`) `my-3 first:mt-0 last:mb-0 min-w-0 rounded-lg bg-surface p-4`.
- Header `mb-2 flex flex-wrap items-center gap-2`: `PanelTopOpenIcon` `size-3.5 text-cyan-text`, "Input requested" `font-ui text-xs font-semibold text-cyan-text`, type metadata pill `ms-auto`.
- Title `font-display text-base font-semibold text-fg wrap-anywhere`. Prompt and labels `font-body text-sm text-fg-secondary`.
- Fields (`Input`, `Textarea`, `SelectTrigger`) at the call site: `border-0 bg-muted-surface text-fg placeholder:text-faint focus-visible:ring-0 focus-cue`. The primitives still carry a border (deferred to brand-fidelity-audit), so the override is required here.
- Buttons: accept and submit use the default (ember) `Button`; cancel uses `variant="ghost"` (not `outline`, which has a border). `SendIcon` `size-3.5` with `me-1`.
- Status row `mt-3 flex flex-wrap items-center gap-2`: Sending pill while submitting; Response captured pill when `submitted || hasResponse`; on error, `font-body text-sm text-danger-text` with plain language: "Your response was not sent. Try again." Never show the server body.
- Inputs stay enabled until `submitted || hasResponse` (design decision 5). `status === "complete"` alone does not disable them or show the pill.
- Returned result: `mt-3 max-h-40 overflow-auto rounded-md bg-code p-3 font-mono text-xs text-fg whitespace-pre-wrap wrap-break-word` with `tabIndex={0} focus-cue`. Drop the `ScrollArea` border.

### 7.12 A2UI display (`A2uiDisplayBlock`)

As in the §6 row. Header `mb-2 flex flex-wrap items-center gap-2`; title `font-display text-base font-semibold text-fg wrap-anywhere`; content box `mt-2 max-h-64 overflow-y-auto rounded-md bg-raised p-3 font-body text-sm leading-relaxed text-fg-secondary whitespace-pre-wrap wrap-break-word`.

---

## 8. Markdown elements (`enhanced-markdown-text.tsx`)

| Element | Classes |
|---|---|
| Root (`MarkdownTextPrimitive`) | `aui-md max-w-none wrap-break-word text-fg data-[status=running]:**:after:text-cyan` |
| `p` | `my-3 max-w-[68ch] first:mt-0 last:mb-0` |
| `a` | `text-ember-text underline underline-offset-2 wrap-anywhere hover:text-fg focus-cue rounded-sm` |
| `ul` / `ol` | `my-3 ms-5 max-w-[68ch] list-disc` / `list-decimal`, `marker:text-faint [&>li]:mt-1` |
| `blockquote` | `my-3 max-w-[68ch] rounded-md bg-surface px-4 py-2 text-fg-secondary` (no left rule; the fill replaces it) |
| headings | §2, each with `max-w-[68ch]` and `mt-6 mb-2 first:mt-0` |
| inline `code` | `rounded-sm bg-muted-surface px-1.5 py-0.5 font-mono text-[0.875em] text-fg` (no border; 0.875em of 15px is 13px) |
| table wrapper | `my-3 overflow-x-auto rounded-lg bg-surface` with `tabIndex={0} role="region" aria-label="Table" focus-cue` |
| `table` | `w-full border-separate border-spacing-0 text-sm` |
| `th` | `bg-raised px-3 py-2 text-start font-ui text-xs font-semibold text-fg-secondary` |
| `td` | `px-3 py-2 text-start align-top text-fg` (no `border-b`) |
| `tr` | `even:bg-muted-surface` on body rows (row fills, not grid lines, per §3.2) |
| `hr` | `my-6 h-0 border-0 bg-transparent` |
| `img` (new) | §6 image row |
| `sup` (footnote refs) | `[&>a]:font-mono [&>a]:text-xs [&>a]:text-cyan-text [&>a]:no-underline` (footnotes are citations, so cyan) |

---

## 9. Motion

Motion explains a state change and nothing else (§4.4). Only opacity, transform and background colour animate. Durations and easings come from the tokens: `--km-duration-fast` (150ms), `--km-duration-page` (250ms), `ease-brand-out`.

| Moment | What moves | Timing | Classes | Reduced motion |
|---|---|---|---|---|
| New message appears | opacity 0 to 1, 4px rise | 150ms, ease-out | existing `animate-in fade-in slide-in-from-bottom-1 duration-150` | appears in place |
| Streaming mark (prose) | assistant-ui's end-of-text dot, recoloured cyan; opacity pulses 1 to 0.5 | 2s loop (`aui-pulse`) | markdown root `data-[status=running]:**:after:text-cyan` | static cyan dot |
| Streaming mark (thinking, expanded) | cyan dot at the end of the text | 1.5s loop | `ms-1 inline-block size-1.5 rounded-full bg-cyan align-middle animate-shimmer` with `aria-hidden` | static cyan dot |
| Thinking pulse (header) | three cyan dots, opacity 0.5 to 1, staggered 150ms | 1.5s loop | §7.1 | static dots; the label still says "Thinking" |
| Status: Running / Sending | spinner rotation | 1s loop | `animate-spin` on `Loader2Icon` | static icon; the label says "Running" |
| Expand / collapse (thinking, tool, artifact) | chevron rotates 180 degrees; panel opacity 0 to 1 | 150ms, `ease-brand-out` | §7.1; no height animation | instant |
| Hover and focus fills | background colour | 150ms, `ease-brand-out` | `transition-hover` | instant |
| Composer focus | `bg-surface` to `bg-raised` | 150ms | `transition-hover` on the dropzone | instant |
| Full-screen artifact | scrim and dialog fade | Dialog primitive defaults | `Dialog` | instant |
| Copy confirmation | icon and text swap to "Copied" | instant, reverts after 2.5s | none | same |

Reduced motion needs no per-component work. The global rule in `src/index.css` sets every animation to 0.01ms and one iteration, and every transition to 0s. The loops end on their base state, so each streaming and running indicator becomes a static cyan mark and a text label still carries the state. Do not add `motion-reduce:` variants that hide the marks; the mark is information, not decoration.

Do not animate: height or width of panels, the composer's size as it grows, message reordering, or anything while the thread is idle.

---

## 10. Responsive behaviour

The thread root is a container (`@container`). Container variants (`@md` is 28rem, 448px) follow the thread's width, so the same rules hold inside the context-panel layouts from app-shell-flat2.

### 10.1 At 320px (the floor)

- The document never scrolls horizontally: `scrollWidth <= 320` with every block shown (task 3.2 asserts it).
- Viewport `px-4` leaves 288px. Message roots drop to `px-0` and avatars and the agent mark are hidden below `@md`, so the full 288px is text.
- Prose wraps with `wrap-break-word`; long URLs and identifiers (tool names, skill names, memory keys, citation sources, artifact titles, links) use `wrap-anywhere`. Nothing uses `truncate` or an ellipsis. A long tool name is fully visible across lines.
- Every flex child that holds text has `min-w-0`.
- Pills reflow: in tool, skill and memory headers the name and pill sit in a `flex-wrap` group, so the pill drops below the name when the line is full. Icons and chevrons stay outside the group, top-aligned (`items-start`, `mt-0.5`).
- Horizontal scroll exists only inside: code wells, JSON result wells, markdown tables, Mermaid diagrams, and the A2UI result box. Each is a focusable region (§7.7). The HTML preview is fixed to its card width and the author's page scrolls inside the iframe.
- User message fill: `max-w-[min(85%,36rem)]`, so about 245px at 320.
- HTML artifact toolbar wraps: title on its own line, controls below.
- Composer: full 288px; action row keeps one line (attach, caching, send are icons).

### 10.2 At 768, 1024 and 1440

- `@md` and up: avatar and agent mark shown (32px column plus 12px gap), message roots `px-4`, action row aligned with `ms-11`.
- The thread column caps at 48rem (768px). At 1440 the prose measure caps at 68ch inside it; blocks use the full column.
- At 768 and 1024 the context panel is a sheet (app-shell-flat2), so the thread keeps its full width.

---

## 11. Accessibility notes that affect visuals

- Focus: every interactive element in the thread uses `focus-cue` (hover fill plus 2px ember outline), except the composer textarea (§4) and default `Button`s, which keep the primitive's ring.
- Collapsible triggers expose `aria-expanded`; segmented toggles expose `aria-pressed`; icon buttons have names through `TooltipIconButton`'s `sr-only` text.
- No button inside a button: the tool header is one `Button` containing only text and a non-interactive pill (axe `nested-interactive`).
- Colour is never the only carrier: every status has an icon and a text label; every block has a text label.
- Contrast: every text and fill pair named in this document is covered by `src/styles/tokens.test.ts` (both themes, 4.5:1 or more).

---

## 12. Visual acceptance criteria (for 4.1 capture review)

Review the fixture thread at 320, 768, 1024 and 1440 in both themes. Each item should be checkable from a capture or computed style.

1. No element in the thread region has a visible border, divider line, box shadow, backdrop filter or gradient.
2. The assistant reply has no fill; its paragraphs are Roboto and no line is longer than 68ch.
3. The user message is on the ember-tinted fill at the trailing edge, 16px radius with a 6px trailing top corner, and its text is readable (4.5:1 or more) in both themes.
4. Reply-to-question gap is visibly smaller than the gap before the next question (16px vs 48px).
5. Thinking and citation blocks are cyan-tinted; tool, skill, memory, context, artifact and A2UI cards are neutral filled surfaces; code is on the code well.
6. Every status is a pill with icon and text; Running is cyan, not amber.
7. No text in the thread is smaller than 12px; no text is dimmed by opacity.
8. The composer is a filled surface with no outline at rest and on focus, and its fill changes on focus.
9. At 320 there is no page-level horizontal scroll, the long tool name is fully visible, and pills sit below names where they do not fit.
10. The HTML preview sits on white in both themes; full screen dims the page with the scrim and no blur.
11. Streaming indicators are cyan; with reduced motion they are static and still visible.
12. Ember appears only on the user fill, links, "Show more", the caching toggle when on, and primary buttons.

---

## 13. Decisions and open items

Decided here:
- `--km-artifact-canvas` is white in both themes (`src/styles/tokens.css`, exposed as `bg-artifact-canvas`). The preview is the author's document; any tint lowers authored contrast (the AA grey, 4.54:1 on white, falls below 4.5:1 on any off-white) and a dark value would hide unstyled black text. `tokens.test.ts` checks black and the AA grey on it in both themes. Cost: a bright rectangle in the dark theme, framed by the raised toolbar.
- Running is cyan (AI working), not amber. This differs from the current tool block and matches `StatusBadge`.
- Assistant replies drop the avatar label; a decorative mark at `@md` and up plus an `sr-only` "Agent:" prefix replace it.

For the product owner:
1. **Thinking metadata.** §7.5 asks for duration and token metadata on thinking blocks. The reasoning part carries neither, and parsing changes are a non-goal. Accept "no metadata" for this change, or route a follow-up to add timing to the stream?
2. **Image actions and provenance.** §7.5 asks for open/download and provenance on images. This change only constrains and labels them. Follow-up change, or in scope?
3. **Dark-theme artifact glare.** If a bright preview in the dark theme is judged worse than the contrast loss, the alternative is a per-theme value. I recommend keeping white.

Known risks for 4.1 to check (file to km-creative-director if they show):
- **Light composer anchor** (§4.2): `bg-surface` on `bg-canvas` is 1.03:1.
- **Dark code well on canvas**: `bg-code` on `bg-canvas` in the dark theme is 1.03:1 in luminance (it differs mostly in hue). The `bg-raised` header row marks where a code block starts. If code bodies read as bare canvas in the dark captures, `--km-code` needs a new dark value.
- **Shiki palettes** (`github-light`, `github-dark-dimmed`) were designed for their own backgrounds, not `bg-code`. Low-contrast comment colours would only show in captures and the axe run.
- **Mermaid theme colours** are inline SVG fills from Mermaid's theme, outside our tokens. Out of scope; note any contrast failure for a follow-up.
