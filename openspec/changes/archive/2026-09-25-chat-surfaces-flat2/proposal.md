## Why

The conversation surfaces still use the pre-rebrand treatment, and the rest of the app is now Flat 2.0. A scan of `src/features/chat`, `src/components/assistant-ui` and `src/features/artifacts` (~2,950 lines) finds ~163 borders, shadows, blur, sub-12px sizes and raw palette colours. Some of these block users today:

- **Light-theme user message is unreadable.** It uses `bg-zinc-800` fill with `text-foreground`, so light text sits on a dark fill in dark mode and dark text sits on a dark fill in light mode.
- **Content blocks fail axe contrast.** They use opacity-dimmed text (`text-primary/70`, `text-muted-foreground/70`) and 9–11px mono metadata.
- **The 320px layout breaks.** The context-update block overflows horizontally and tool names truncate with no way to read the full name.
- **The A2UI input misstates its state.** It shows "Response captured" as soon as the tool call's stream completes, before the user has answered.
- **Mermaid artifacts sometimes show as source text.** The markdown path renders diagrams, but the artifact path does not route `mermaid` to the diagram renderer.
- **The composer is a blurred, outlined box.** It uses `border border-input`, `backdrop-blur-xs` and a focus ring halo, and shell captures show an ember outline around it.

The binding KnowMe UI/UX standard forbids all of this: §3 (Flat 2.0), §4.2 (12px floor) and §7.5/§7.7 (conversation event presentation and chat visual treatment).

## What Changes

- **Messages.** Assistant replies become unbubbled authored prose on the canvas, set in the long-form body face (Roboto) and kept to a readable width. User messages become an ember-tinted fill (`ember-soft`) on the trailing edge. The raw-palette user avatar is replaced with tokens.
- **Composer.** The composer becomes a filled surface with no border, no blur and no outline box. Focus shows as a change in fill, and the ember outline is removed.
- **Reasoning and sources.** Thinking/reasoning and citation blocks use cyan-tinted flat surfaces.
- **Tool activity.** Tool call, memory, skill and context-update blocks use surface/raised tokens. Their metadata is mono and at least 12px, and status uses status tokens with a text label.
- **Code and artifacts.** Code blocks use the brand code background. Artifact, HTML-artifact and A2UI cards are borderless. The HTML-artifact preview backdrop uses a token instead of `bg-white`, and the full-screen overlay uses the scrim token instead of blur.
- **Streaming.** The streaming cursor and the thinking pulse use cyan.
- **Behaviour fixes.**
  - A2UI shows "Response captured" only after a response is sent or received.
  - Mermaid artifacts render as diagrams, with a source fallback when rendering fails.
  - Tool names and context-update content wrap at 320px.
- **Guard.** The Flat 2.0 guard test extends to the chat and artifact files, adding checks for hex values, `bg-white` and opacity-dimmed text.

## Capabilities

### New Capabilities
- `chat-surfaces`: visual treatment and state honesty of the conversation thread, composer, streamed content blocks and artifacts under Flat 2.0.

### Modified Capabilities
None. `chat-layout` (bounded width, wrapping) and `chat-stream-rendering` (every block shown, reload) keep their requirements. This change restyles within them.

## Impact

- **Code:** `src/components/assistant-ui/{enhanced-thread,enhanced-markdown-text}.tsx`, `src/features/chat/components/*`, `src/features/artifacts/*`, one new token in `src/styles/tokens.css`, `src/test/flat-shell.test.ts`, new e2e checks under `e2e/`.
- **Docs:** `docs/design/chat-surfaces.md` (new).
- **Data and APIs:** no changes. Message storage, AG-UI parsing and UAR calls are untouched.
- **Not covered here:**
  - `attachment.tsx` semantics, which belong to assistant-ui-latest.
  - The activity/event inspector (§7.5), a separate feature.
  - Pages outside the thread, which belong to app-pages-flat2-entity-views.
