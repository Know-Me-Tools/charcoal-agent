/**
 * DRAFT: needs the chief content officer's pre-review and the operator's
 * recorded approval before it ships (change `app-db-reset-notice`, phase
 * `site-chat-follow-ups`). The review record is
 * `docs/content/reviews/site-db-reset-notice.md`. Change this text only with
 * a new review record.
 *
 * Shown once, after the browser database could not be read, was deleted and
 * was created again. It states what happened and nothing more: it does not
 * promise the chats can be recovered and does not name a cause.
 */
export interface DbResetNoticeContent {
	/** One line, shown as a toast after the new database is ready. */
	text: string;
}

export const DB_RESET_NOTICE_CONTENT: DbResetNoticeContent = {
	text: "Your saved chats on this device could not be read, so this device's chat history was reset.",
};
