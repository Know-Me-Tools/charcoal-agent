/**
 * DRAFT: every string below needs the chief content officer's pre-review and
 * the operator's recorded approval before it ships (task 4.5 of change
 * `app-chat-export-okf-single`, phase `chat-export-and-block-copy`). The
 * review record goes under `docs/content/reviews/`. Every visitor-facing
 * string of the export control lives in this one file, so approval means
 * reviewing one file. Change this text only with a new review record.
 *
 * Wording rules (spec `docs/specs/chat-export-okf-and-block-copy.md` 9.1):
 * plain, no hype, no exclamation marks. The privacy line states only what the
 * export does: the file is made in this browser and the export makes no
 * network request. It says nothing about what happens to the file afterwards,
 * and it does not describe the conversation itself as private.
 */
export interface ChatExportContent {
	/** Visible label and accessible name of the top-bar button. */
	menuLabel: string;
	/** Title of the menu and of the mobile bottom sheet. */
	menuTitle: string;
	/**
	 * Privacy line, always visible inside the menu (touch has no hover).
	 * Claims: built in this browser; the export makes no network request.
	 */
	privacyLine: string;
	/**
	 * Save action. Its label describes the file, not the route the browser
	 * takes (share sheet or download).
	 */
	saveFile: string;
	/** Copy action: the same Markdown, placed on the clipboard. */
	copyMarkdown: string;
	/** Visible reason shown while a reply is still arriving. */
	disabledStreaming: string;
	/** Visible reason shown when the conversation has nothing complete to export. */
	disabledEmpty: string;
	/** Status after the file was handed to the share sheet or downloaded. */
	savedStatus: string;
	/** Status after the Markdown was copied. */
	copiedStatus: string;
	/** Status when every save route failed and the text fallback opened. */
	saveFailedStatus: string;
	/** Status when copying failed. */
	copyFailedStatus: string;
	/** Heading of the on-screen text fallback. */
	fallbackTitle: string;
	/** One line under the fallback heading telling the visitor what to do. */
	fallbackHelp: string;
	/** Accessible name of the fallback text area. */
	fallbackTextLabel: string;
	/** Label of the button that closes the fallback. */
	fallbackClose: string;
	/** Accessible name of the close button on the mobile sheet. */
	closeLabel: string;
}

export const CHAT_EXPORT_CONTENT: ChatExportContent = {
	menuLabel: "Export",
	menuTitle: "Export this conversation",
	privacyLine: "Made in this browser. The export makes no network request.",
	saveFile: "Save as Markdown file (.md)",
	copyMarkdown: "Copy as Markdown",
	disabledStreaming: "Export is available when the reply has finished.",
	disabledEmpty: "Nothing to export yet.",
	savedStatus: "Conversation saved.",
	copiedStatus: "Markdown copied.",
	saveFailedStatus: "Could not save the file. Copy the text below instead.",
	copyFailedStatus: "Could not copy. Select the text and copy it yourself.",
	fallbackTitle: "Copy the conversation",
	fallbackHelp: "Select all of the text below, then copy it.",
	fallbackTextLabel: "Conversation as Markdown",
	fallbackClose: "Close",
	closeLabel: "Close export menu",
};
