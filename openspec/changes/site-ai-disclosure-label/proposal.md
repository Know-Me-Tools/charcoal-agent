## Why

Disclosure today depends on the model saying it is an AI concierge (`uar/agents/knowme-site.json`). That is probabilistic and does not meet EU AI Act Art. 50(1) and (5) ("designed and developed", "at the latest at the time of the first interaction"). FR-31 requires a static, non-model label before the first token and `data-ai-generated="true"` on every agent message; FR-35 asks for a sensitive-data hint. This closes §6.4 item 7.

## What Changes

- A static label beside the composer and on the first agent bubble; `data-ai-generated="true"` on every agent message; the sensitive-data hint near the composer. The copy goes through the operator approval gate.
- Lands in: this repo. Owner: km-frontend-engineer; copy from km-conversational-designer and km-chief-content-officer.
- Depends on: none.
- Plan: `.kbd-orchestrator/phases/uar-integration/plan.md` (revision 3); `docs/agent-led-site/sections/09-implementation-plan.md` (Phase 0, new changes).

## Impact

- Capability: `site-ai-disclosure-label`.
- Files: `src/components/assistant-ui/enhanced-thread.tsx` (composer and `AssistantMessage`), the copy source under `content/site/`, `docs/content/reviews/site-ai-disclosure-label.md`, tests.
