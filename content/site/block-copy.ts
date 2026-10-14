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
	/** Accessible name of the copy button on a table in a reply. */
	copyTable: string;
	/** Accessible name of the copy button on a display-math block. */
	copyMath: string;
	/** Accessible name of the copy button on an image in a reply. */
	copyImage: string;
	/** Success text when the image itself went to the clipboard (PNG). */
	copiedImage: string;
	/** Success text when only the image URL was copied (no image clipboard support). */
	copiedImageLink: string;
	/** Accessible name of the copy button on a video in a reply (copies its link). */
	copyVideoLink: string;
	/** Accessible name of the copy button on an A2UI card frame. */
	copyCard: string;
	/** Accessible name of the copy button on an SVG block. */
	copySvgSource: string;
	/** Header title of an SVG block. */
	svgTitle: string;
	/** Toggle label: show the drawing. */
	svgPreview: string;
	/** Toggle label: show the SVG source. */
	svgSource: string;
	/** Visible label of the SVG download button. */
	svgDownload: string;
	/** Accessible name of the SVG download button. */
	svgDownloadLabel: string;
	/** Alt text of the rendered SVG image. */
	svgAlt: string;
	/** One-line note shown instead of the drawing when the SVG is over the size cap. */
	svgTooLarge: string;
}

export const BLOCK_COPY_CONTENT: BlockCopyContent = {
	copy: "Copy",
	copied: "Copied",
	copyFailed: "Couldn't copy",
	copyCode: "Copy code",
	copyDiagramSource: "Copy diagram source",
	copyArtifact: "Copy content",
	copyTable: "Copy table",
	copyMath: "Copy math",
	copyImage: "Copy image",
	copiedImage: "Copied image",
	copiedImageLink: "Copied image link",
	copyVideoLink: "Copy video link",
	copyCard: "Copy card",
	copySvgSource: "Copy SVG source",
	svgTitle: "SVG",
	svgPreview: "Preview",
	svgSource: "Source",
	svgDownload: "Download",
	svgDownloadLabel: "Download SVG",
	svgAlt: "SVG diagram",
	svgTooLarge: "This SVG is too large to preview, so only its source is shown.",
};
