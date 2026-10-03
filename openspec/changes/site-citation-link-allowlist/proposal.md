## Why

`src/features/chat/components/citation-block.tsx` renders any `url` it is given as an `<a href>` that opens in a new tab. The URL comes from the model's stream, so an injected or hallucinated URL becomes a clickable link under a "Sources" heading (§6.2 T4). FR-16 requires that a citation URL is a link only if it matches a corpus URL string or a host on the site-owned allowlist; otherwise it renders as plain text with the full destination. This closes §6.4 item 12.

## What Changes

- Citation URLs render as links only when they match a URL string in the corpus (`content/knowledge/*.md`) or a host on a site-owned allowlist; otherwise as plain text showing the full destination.
- Lands in: this repo. Owner: km-frontend-engineer; km-security-officer reviews.
- Depends on: none.
- Plan: `.kbd-orchestrator/phases/uar-integration/plan.md` (revision 3); `docs/agent-led-site/sections/09-implementation-plan.md` (Phase 0, new changes).

## Impact

- Capability: `site-citation-link-allowlist`.
- Files: `src/features/chat/components/citation-block.tsx`, a new link-policy module and its generated corpus URL list, a build step that extracts corpus URLs, tests.
