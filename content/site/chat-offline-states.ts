/**
 * DRAFT copy — pending operator approval, recorded in
 * `docs/content/reviews/site-chat-offline-states.md`. Do not treat as
 * final; see that file before changing or shipping this text.
 *
 * Covers the agent-offline notice (FR-27), the 429 rate-limit message
 * (FR-28), and the "Blocked by policy" tool-call label (FR-11 — a short,
 * fixed string, not drafted here since it needs no sentence-level copy).
 * Components import from here so approval only ever means editing this
 * file (site-chat-offline-states, tasks 1.2-1.3).
 */
export interface ChatOfflineStatesContent {
  offlineNotice: {
    heading: string;
    body: string;
    ctaLabel: string;
  };
  rateLimited: {
    /** `seconds` is always a positive integer here; callers never pass 0. */
    withWait: (seconds: number) => string;
    withoutWait: string;
  };
}

export const CHAT_OFFLINE_STATES_CONTENT: ChatOfflineStatesContent = {
  offlineNotice: {
    heading: "The agent is offline right now.",
    body: "It can't reply at the moment. You can still look around while it's back.",
    ctaLabel: "See what KnowMe does",
  },
  rateLimited: {
    withWait: (seconds) => `Too many messages — try again in ${seconds} seconds.`,
    withoutWait: "Too many messages — try again in a moment.",
  },
};
