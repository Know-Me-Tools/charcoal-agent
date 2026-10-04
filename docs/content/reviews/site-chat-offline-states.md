# Review record: chat offline, rate-limit and policy-denied copy

- **Piece:** `content/site/chat-offline-states.ts` → `CHAT_OFFLINE_STATES_CONTENT`.
- **Draft offline notice:** heading "The agent is offline right now.", body "It can't reply at the moment. You can still look around while it's back.", CTA "See what KnowMe does" (links to `/`, the landing page — FR-27's "points to the landing page content that exists in Phase 0").
- **Draft 429 message:** with a wait time, "Too many messages — try again in {n} seconds."; without one, "Too many messages — try again in a moment."
- **"Blocked by policy"** (FR-11 client case, `src/features/chat/components/tool-call-block.tsx`): a short, fixed status-pill label, not drafted here — it names the launch run policy's effect in neutral terms, no further wording decision needed.
- **Why:** FR-27 and FR-28 ask for a visible, calm state instead of the chat looking broken when UAR is down, the spend ceiling or its meter fails, the kill switch is on, or the visitor is rate-limited. §6.4 item mapped to `site-chat-offline-states`.
- **Claims checked:** no product or capability claim; the offline notice does not promise a return time. No banned words (Brand Guide v1.0 §02).
- **Voice:** short, calm, no hype language, matches `src/test/brand-copy.test.ts`'s banned-word guard.
- **Scope note:** "starter chips still navigate" (task 1.4) cannot be verified yet — starter chips are a Phase 1, not-yet-built decision (`docs/agent-led-site/agent-led-site.md` §7, owner km-frontend-engineer, sign-off km-product-owner). Nothing in this change disables or depends on them; this note flags it for when they land.
- **Operator approval: PENDING.** No operator has reviewed or approved this copy. It is wired into the UI as a single source (`content/site/chat-offline-states.ts`) so approval is a one-file edit, but it SHALL NOT be treated as final or shipped to an external channel until this record carries the operator's name, date and the approved file's git hash.
