/**
 * DRAFT, pending operator approval (record in `docs/content/reviews/site-history-link.md`).
 *
 * The front-page header link that takes a returning visitor to the conversations
 * stored in this browser. It is shown only when this browser holds at least one
 * saved conversation. The wording makes no claim beyond what the About panel
 * already says ("stored in this browser").
 */
export interface HistoryLinkContent {
	/** Visible link text. */
	label: string;
}

export const HISTORY_LINK_CONTENT: HistoryLinkContent = {
	label: "Your conversations",
};
