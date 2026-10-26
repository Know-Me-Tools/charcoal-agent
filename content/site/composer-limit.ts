/**
 * Draft, in review. The content officer has not pre-reviewed this text; merge
 * counts as the operator's approval. Recorded in
 * `docs/content/reviews/site-composer-limit.md`. See that file before
 * changing this text.
 *
 * The site's chat takes at most `limit` characters per message (the server
 * rejects more with a 413). Covers the character counter under the composer
 * and the notice shown when a message is still refused for length. Components
 * import from here so approval only ever means editing this file.
 */
export interface ComposerLimitContent {
  /** Longest message the server accepts, in characters. Mirrors MAX_MESSAGE_CHARS in the server. */
  limit: number;
  /** The counter appears once the message reaches this many characters. */
  showFrom: number;
  /** Remaining characters at or below which the counter turns to the warning colour. */
  warnWithin: number;
  /** Visible counter text; `n` is always a whole number. */
  remaining: (n: number) => string;
  over: (n: number) => string;
  /** Hint beside the counter, below and above the limit. */
  hint: string;
  hintOver: string;
  /** Screen-reader announcements. Updated in steps of 100, never per keystroke. */
  liveRemaining: (n: number) => string;
  liveOver: string;
  /** Accessible name of the counter group. */
  counterLabel: string;
  /** Notice shown when the server still refuses a message as too long (413). */
  tooLongNotice: {
    heading: string;
    body: string;
  };
}

const plural = (n: number, noun: string): string =>
  `${n.toLocaleString("en-US")} ${noun}${n === 1 ? "" : "s"}`;

export const COMPOSER_LIMIT_CONTENT: ComposerLimitContent = {
  limit: 4000,
  showFrom: 3200,
  warnWithin: 400,
  remaining: (n) => `${plural(n, "character")} left`,
  over: (n) => `${plural(n, "character")} over`,
  hint: "Please summarise it to a few lines.",
  hintOver: "Too long to send. Please summarise it to a few lines.",
  liveRemaining: (n) => `About ${plural(n, "character")} left`,
  liveOver: "Over the character limit. Sending is off until you shorten the message.",
  counterLabel: "Message length",
  tooLongNotice: {
    heading: "That message is too long.",
    body: "Chat takes up to 4,000 characters at a time. Your text is still in the message box. Please summarise it to a few lines and send it again.",
  },
};
