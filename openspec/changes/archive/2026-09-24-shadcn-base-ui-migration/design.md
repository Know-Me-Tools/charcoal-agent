## Context

See proposal.md. After `tailwind-v4-foundation`, the project is on Tailwind 4 with CSS-first tokens and `components.json` still declaring `style: "default"` (Radix). 48 shadcn files exist; 22 primitives have consumers. Consumers of migrated primitives that use Radix-only APIs: `TooltipTrigger asChild` (tooltip-icon-button, attachment, enhanced-thread), `CollapsibleTrigger asChild` + `Collapsible onOpenChange` (enhanced-thread), `DialogTrigger asChild` (attachment), `Select onValueChange` (agents, agent-detail, a2ui block, user-settings), `Switch onCheckedChange` (user-settings), and `tooltip-icon-button` importing `@radix-ui/react-slot` directly. assistant-ui 0.12 primitives also use `asChild`; that is assistant-ui's own API and stays until `assistant-ui-latest`.

## Goals / Non-Goals

**Goals:** only Base UI primitives in `src/components/ui`; same behavior and roughly the same look (visual parity within the harness screenshots); no direct Radix dependency; one toast system.

**Non-Goals:** brand styling; Flat 2.0 border removal; upgrading assistant-ui.

## Decisions

1. **Style `base-nova`.** It is the default Base UI style in shadcn 4.21 docs and the one `shadcn create` emits; visual choices are temporary because `knowme-brand-tokens` re-themes via tokens. Alternatives (other `base-*` styles) offer no advantage before rebranding.
2. **Reinstall with the CLI, then reconcile.** `npx shadcn@4.21.0 add <used primitives> --overwrite` pulls Base UI variants and rewrites imports for our aliases. The CLI may also touch `src/index.css`; any token/`@theme` changes it makes are reverted in this change (tokens belong to `knowme-brand-tokens`), except additions required for the new components to render (reviewed individually).
3. **Delete instead of migrate** everything with zero consumers (26 primitives, dead assistant-ui/chat components), verified by repo-wide grep before deletion. Smaller surface for the rebrand; the CLI can re-add any primitive later.
4. **Call-site migration follows the shadcn `migrate-radix-to-base` mapping:** `asChild` → `render={<Element/>}` (with `nativeButton={false}` when rendering a non-button), handlers take `(value, eventDetails)` — our handlers ignore the second argument, so most changes are type-level; Base UI `Select` `onValueChange` may pass `null` — handlers guard against it.
5. **Sonner only.** Keep Sonner (not Radix; base-nova `sonner` depends on `next-themes`), but make the wrapper read the theme from the app's `ui-store` so `next-themes` can be removed; delete shadcn `toast`/`toaster`/`use-toast` (no callers).
6. **Verification:** vitest + Testing Library component tests for the spec scenarios (dialog focus/escape/return focus, select keyboard, tooltip on focus, switch Space, collapsible expanded state) because the live Dialog/Switch are only reachable behind attachments/JWT; e2e harness for pages (select + tabs on the agent editor, collapsible reasoning in the thread) and screenshot comparison against the previous run.

## Risks / Trade-offs

- [Base UI Select positions its popup differently from Radix (`alignItemWithTrigger`)] → visual check in screenshots; acceptable pre-rebrand.
- [CLI overwrites local edits in `ui/*`] → only `sidebar.tsx`, `attachment`-adjacent fixes and `chart.tsx` were edited in earlier changes; `sidebar`/`chart` are deleted, nothing else is lost.
- [jsdom lacks layout APIs Base UI positioners use] → component tests may need `ResizeObserver`/`getBoundingClientRect` shims in `src/test/setup.ts`.
- [assistant-ui 0.12 still pulls Radix transitively] → acceptable until `assistant-ui-latest`; acceptance checks direct dependencies and `src/` imports.

## Migration Plan

Branch `rebrand/shadcn-base-ui-migration`; merge after gates. Rollback = revert merge (no data changes).
