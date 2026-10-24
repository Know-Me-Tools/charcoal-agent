/**
 * DRAFT, pending operator approval (record in `docs/content/reviews/site-ask-concierge.md`).
 *
 * The visitor-facing strings of the ask-the-concierge entries: the header
 * entry, the question chip's compact form and the inline composer's send
 * button. Prompts and placeholders are NOT here: each caller passes its own
 * (product pages and the directory write theirs in later changes, under the
 * prompt rules in docs/design/product-directory.md section 5.2).
 */
export interface AskConciergeContent {
	/** Header entry: visible label from 640 px, and its accessible name at every width. */
	headerLabel: string;
	/** Compact chip: the visible word on index rows, where the prompt is not shown. */
	chipLabel: string;
	/**
	 * Compact chip: accessible name. `{prompt}` is replaced by the chip's prompt.
	 * It starts with the visible `chipLabel`, so the visible label leads the name.
	 */
	chipNameTemplate: string;
	/** Inline composer: send button text and accessible name. */
	composerSubmitLabel: string;
}

export const ASK_CONCIERGE_CONTENT: AskConciergeContent = {
	headerLabel: "Ask the concierge",
	chipLabel: "Ask",
	chipNameTemplate: "Ask the concierge: {prompt}",
	composerSubmitLabel: "Ask",
};
