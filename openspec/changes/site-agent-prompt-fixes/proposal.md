## Why

The system prompt in `uar/agents/knowme-site.json` still tells the agent twice to "point the visitor to the About or Contact page". `/settings/about` 404s in the site build (`src/App.tsx:33-50`, `use-site-config.ts:22`) and no contact page exists, so every "I don't know" answer sends visitors to a dead route (FR-9). It also calls the agent "the KnowMe Concierge" and lacks the tool-scope line from §5.5.

## What Changes

- Remove both "About or Contact page" instructions; in Phase 0 the agent names no site routes and offers the in-chat company topic instead, and says there is no separate contact page.
- Add the tool-scope line: "Use only the tools you are given, only to answer the visitor's question, and never imply a call you did not make."
- The agent self-identifies as "the KnowMe agent".
- Lands in: this repo. Owner: km-conversational-designer.
- Depends on: `site-agent-seed`, `site-agent-tool-allowlist`.
- Plan: `.kbd-orchestrator/phases/uar-integration/plan.md` (revision 3); `docs/agent-led-site/sections/09-implementation-plan.md` (Phase 0, new changes).

## Impact

- Capability: `site-agent-prompt-fixes`.
- Files: `uar/agents/knowme-site.json` (`system` prompt and `title` if it names the concierge), re-seed through `scripts/seed-site-agent.sh`.
