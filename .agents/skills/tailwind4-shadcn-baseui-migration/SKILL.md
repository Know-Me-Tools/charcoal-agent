---
name: tailwind4-shadcn-baseui-migration
description: Pitfalls found migrating a React + Vite app from Tailwind 3 to Tailwind 4, from shadcn/ui on Radix to shadcn/ui on Base UI, and to a current assistant-ui, most of which break silently with a green build. Covers what the Tailwind upgrade codemod gets wrong, shadcn CLI surprises, Base UI API differences (render instead of asChild, Select items, nullable onValueChange), design-token guard tests, contrast tests, and reduced-motion side effects. Use this skill whenever planning, doing or reviewing a Tailwind v4 upgrade, a Radix-to-Base-UI or shadcn migration, an assistant-ui upgrade, or token-based theming in a Tailwind 4 + shadcn project, even if the build passes.
license: MIT
compatibility: "Tailwind CSS 4.x, shadcn/ui (Base UI registry), @base-ui-components/react, assistant-ui 0.1x"
metadata:
  origin: "KnowMe AI web client, complete-rebranding phase, 2026-09"
---

# Tailwind 4, shadcn on Base UI, assistant-ui: what broke quietly

Every item here passed the build and most passed the unit tests. They were found by reading diffs, by browser tests, or by cross-model review. Tool behaviour (codemod, CLI) is as observed with the versions current in September 2026; treat those items as things to check, not certainties.

**Evidence tags** on each rule: `[verified]` = a failing-then-passing test, a reproduced error or a mutation proof in the origin project; `[docs]` = upstream documentation; `[review]` = found by independent review, fix designed but not yet proven here; `[practice]` = a working convention, not independently tested. Re-check anything version-sensitive against your own versions.

## Tailwind 4 codemod (`npx @tailwindcss/upgrade`) `[verified]`

- **Read the codemod diff line by line.** It renames things that aren't Tailwind classes. It changed a component *prop value* `variant="outline"` to `outline-solid`, which silently dropped the styling.
- **Arbitrary CSS-variable values changed syntax.** v4 writes `border-(--color-border)`. The codemod produced `border-border` in some places, which is a different token.
- **Stacked variants reorder.** Check any class with several variants, such as `dark:hover:`, `group-data-[x]:` or `md:`, against the rendered result. A reordered stack can compile into a selector that never matches.
- **Afterwards,** `[docs]` grep for v3-only names (`shadow-sm`→`shadow-xs`, `ring`→`ring-3`, `outline-none`→`outline-hidden`, `bg-opacity-*`, `flex-grow`). Also grep for `@apply` in CSS modules, which need `@reference`.

## shadcn CLI on Base UI `[verified]`

- **Check the package manager and imports after every `shadcn add`.** A stale `bun.lockb` made the CLI run bun. It also installed an npm package literally named `cn` and wrote `import { cn } from "cn"`. Delete stray lockfiles first, and diff `package.json`.
- **Don't hand-edit `components.json` to switch registries.** That skipped `@import "shadcn/tailwind.css"`, so every `data-*` state variant was missing. Re-run `init`, or add the import.
- **Channel-triplet variables such as `--popover: 0 0% 100%` are not colours.** Wrap them (`hsl(var(--popover))`), or move to full colour tokens. Otherwise the fill disappears with no error.

## Base UI API differences from Radix `[verified]`

| Radix habit | Base UI |
|---|---|
| `asChild` | `render={<Link />}`. Add `nativeButton={false}` when the rendered element isn't a `<button>` |
| `<Select.Value />` shows the label | It shows the raw **value** unless you pass `items` (value→label) to `Select.Root` |
| `onValueChange(v: string)` | Can be called with `null`. Handle it |
| Focus-trap tests in jsdom | jsdom has no `PointerEvent` or layout. Test dialogs, menus and focus traps in a real browser |

## assistant-ui upgrades `[verified]`

- Every message you convert for the runtime needs `metadata`, even an empty object. Otherwise some panels crash on undefined.
- A tool call's status comes from the message part status, not from an `isError` field on the call. A "failed" pill mapped from `isError` is dead code. Check which field the library actually reads.
- Only the last part inherits `running`. Streaming indicators on earlier parts need their own state.
- Create the assistant message on the **first stream event of any kind**, not the first text. Otherwise events that arrive before the first text, such as reasoning, tool calls or errors, are dropped.
- Retry and regenerate must delete the messages after the parent message, awaiting the delete, and must not re-append the user message.

## Guard tests for a token-only design system `[verified]`

- **Contrast as a unit test:** parse the token CSS and assert every text-token × surface-token pair meets 4.5:1 (3:1 for large text and UI marks), in both themes.
- **"No borders, no shadows" as a test:** glob the component directories instead of listing files, so new files are covered. Then plant a banned class once to prove the guard fails.
- **A source scan can't see registry defaults or runtime styles.** Add a browser test that reads computed styles (`border-*-width`, `box-shadow`, `font-size`) across the shell. In the origin project it found a border that the source guard missed.
- **Reduced motion:** a global `* { transition-duration: 0.01ms !important }` broke SVG layout that measures itself (Mermaid diagrams inflated about 5×). Scope the override away from `svg *`.

## Toasts `[practice]`

A bottom-right toast sat over the chat composer. Put toasts top-centre, clear of the input. Use sonner's `unstyled` mode with your own token classes, because the styled mode adds a border and shadow of its own.
