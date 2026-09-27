---
name: knowme-brand-standard
description: The KnowMe AI, LLC brand and Flat 2.0 UI rules for this website. Use before designing, restyling, writing copy for, or reviewing any KnowMe surface (pages, chat, components, social images, docs), and whenever someone mentions KnowMe colours, tokens, typography, the logo/mark/wordmark, "Flat 2.0", borders, shadows, or brand voice.
---

# KnowMe brand standard

The binding sources live outside this repo: `../know-me-system/docs/knowme-ui-ux-standard.md`
(binding for UI), and in `../branding/` the Brand Guide v1.0 (`knowme-brand-guide.html`),
the brand template (`knowme-brand-template.html`) and `logos/`.
Read the relevant section there before inventing anything. This skill is the working summary.
When they disagree, the standard wins, except where WCAG AA requires otherwise (decision D-007).

## Flat 2.0 (non-negotiable)

- No borders, divider lines, drop shadows, gradients, glass or blur. Adjacent areas differ **only by background token**.
- Surface ladder: **canvas** (page) → **chrome** (top bar, sidebar, bottom nav) → **surface** (panels, composer, menus) → **raised** (selected, expanded, modal, streaming).
- Hover = `bg-hover`. Selection or active = `bg-ember-soft` plus stronger text/icon and `aria-current`. Keyboard focus = the `focus-cue` utility (fill plus ember outline), so focus never depends on colour alone.
- Modal priority comes from the `--km-scrim` dim, never from a shadow.
- Status is never colour-only: tone, icon and a text label together.
- `src/test/flat-shell.test.ts` enforces this for the shell. Extend it rather than adding exceptions.

## Tokens

- Only `src/styles/tokens.css` defines colour. Use its Tailwind names (`bg-canvas`, `bg-chrome`, `bg-surface`, `bg-raised`, `bg-hover`, `bg-muted-surface`, `text-fg`, `text-fg-secondary`, `text-faint`, `bg-ember`, `text-ember-text`, `bg-cyan-soft`, `text-success-text`, …). Never use raw palette classes (`zinc-500`) or hex values in components.
- Ember = brand and primary action. Cyan = AI reasoning, citations, streaming. Green, amber and red = status only.
- `*-text` variants are the text-safe versions (≥4.5:1). `src/styles/tokens.test.ts` checks every text × surface pair; add new pairs there.

## Type

- Space Grotesk: display and screen titles, tight tracking. Inter: UI and controls. Roboto: long-form prose. JetBrains Mono: code, model IDs, timestamps, metadata.
- Nothing below 12px. Body 15–17px. Respect the user's font-size setting (rem-based sizes).

## Marks

- Use the components in `src/components/brand/` (`KnowMeMark`, `KnowMeWordmark`, `KnowMeLockup`). Never draw the logo as text or an icon font.
- The "Conviction" K has an ember node that is never recoloured. The wordmark is "Know" + ember "Me".
- Minimum sizes: 16px favicon, 24px nav, 52px hero. Keep clear space of one icon width.
- The name "KnowMe" is announced to assistive tech exactly once per rendering. A mark beside visible "KnowMe" text is decorative.
- Logotypes are exempt from contrast rules (WCAG 1.4.3); the axe run already filters the wordmark.

## Naming and legal

- The product is **KnowMe**; the company is **KnowMe AI, LLC**; the agent is **the KnowMe agent**, running on the **Universal Agent Runtime**. There is no "Charcoal Agent" (D-004).
- Internal identifiers such as `CharcoalDb` and `charcoal-*` storage keys stay unchanged (D-005). `src/test/brand-naming.test.ts` guards this.
- Legal line: "© <year> KnowMe AI, LLC".

## Voice (starting point, owned by the chief content officer)

- Tagline: "AI that understands you."
- Few words, concrete and calm. Invite discovery rather than listing features.
- Plain verbs, no hype adjectives, no exclamation marks, no "revolutionary", "unleash" or "supercharge".
- Say what KnowMe does for the person, then show it (let them talk to it).

## Check before you finish

1. No border, shadow, gradient, blur or raw palette class in the diff.
2. Every colour comes from a token; any new text/fill pair is in `tokens.test.ts`.
3. Brand marks come from `components/brand`.
4. Captures reviewed at 320, 768, 1024 and 1440px in both themes (`npm run test:visual`).
5. `npm run test:a11y` shows no new violations.
