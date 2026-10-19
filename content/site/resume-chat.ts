/**
 * DRAFT, pending operator approval (record in `docs/content/reviews/site-resume-chat.md`).
 *
 * The front-page button that takes a returning visitor straight to their most
 * recent saved conversation. It is shown only on the site build, only when this
 * browser holds at least one saved conversation. The wording says what the
 * button does and nothing about where the conversation is kept: the About panel
 * already says "stored in this browser".
 */
export interface ResumeChatContent {
	/** Visible button text, also its accessible name. */
	label: string;
}

export const RESUME_CHAT_CONTENT: ResumeChatContent = {
	label: "Continue your last conversation",
};
