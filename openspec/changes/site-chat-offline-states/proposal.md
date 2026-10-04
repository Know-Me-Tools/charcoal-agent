## Why

The client turns every non-2xx from `POST /api/chat/completion` into a raw error string (`src/features/chat/use-message-stream.ts:351`: `POST /api/chat/completion ${res.status}: ${text}`), so a 429 with `Retry-After`, an upstream outage, an exhausted spend ceiling and the kill switch all look like a broken chat. `agui.tool_call.denied` has no client case and is dropped. The spend ceiling is now a site-server reserve-and-settle meter (plan N15) that **fails closed when its SurrealDB store is unreachable**, so "meter unavailable" is a fourth way the agent goes offline. FR-27, FR-28 and FR-11's client case need visible states on the deployed stack in Phase 0.

## What Changes

- Client states for agent offline (UAR down, spend ceiling exhausted, meter unavailable, kill switch on), for 429 with the wait time, and "Blocked by policy" for `agui.tool_call.denied`.
- Lands in: this repo. Owner: km-frontend-engineer.
- Depends on: `site-spend-ceiling` (N15: the meter's refusal and fail-closed responses, and the kill switch).
- Plan: `.kbd-orchestrator/phases/uar-integration/plan.md` (revision 3); `docs/agent-led-site/sections/09-implementation-plan.md` (Phase 0, new changes); amendment N15 in `.kbd-orchestrator/phases/uar-integration/children/uar-capability-assessment/plan.md` table A2.

## Impact

- Capability: `site-chat-offline-states`.
- Files: `src/features/chat/use-message-stream.ts`, the chat message store, `src/components/assistant-ui/enhanced-thread.tsx`, a new offline notice and rate-limit message component, copy under `content/site/` with `docs/content/reviews/site-chat-offline-states.md`, tests.
