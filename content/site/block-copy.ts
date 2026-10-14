/**
 * DRAFT — pending content-officer review and operator approval (task 3.6 of
 * change `app-block-copy-and-media-blocks`, phase `chat-export-and-block-copy`).
 * Every visitor-facing string of the per-block Copy control lives in this one
 * file, so approval means reviewing one file; the review record goes under
 * `docs/content/reviews/`. Change this text only with a new review record.
 * Strings follow the draft wording in
 * `docs/specs/chat-export-okf-and-block-copy.md` section 9.2; labels that
 * visitors already saw before this change keep their previous wording
 * ("Copy", "Copied", "Copy code", "Copy content").
 */
export interface BlockCopyContent {
	/** Visible label of the labelled block copy buttons (block headers). */
	copy: string;
	/**
	 * State text after a successful copy: shown on the button and announced
	 * through a polite live region. Resets after 2.5 s.
	 */
	copied: string;
	/**
	 * State text after a failed copy: shown on the button and announced. The
	 * block's own text is selected at the same time, for a manual copy.
	 */
	copyFailed: string;
	/** Accessible name of the copy button on a code block or HTML/TSX artifact. */
	copyCode: string;
	/** Accessible name of the copy button on a Mermaid diagram block. */
	copyDiagramSource: string;
	/** Accessible name of the copy button on an artifact card. */
	copyArtifact: string;
}

export const BLOCK_COPY_CONTENT: BlockCopyContent = {
	copy: "Copy",
	copied: "Copied",
	copyFailed: "Couldn't copy",
	copyCode: "Copy code",
	copyDiagramSource: "Copy diagram source",
	copyArtifact: "Copy content",
};
