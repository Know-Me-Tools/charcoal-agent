/**
 * Fixed text the exported file carries. DRAFT: the visitor-facing wording is
 * pending chief-content-officer review and operator approval (task 4.5, spec
 * section 9; the omission line is in docs/content/reviews/site-export-omission-note.md). Wording makes no claim beyond what the product does: the file is
 * made in the browser and is not uploaded.
 */
export const OKF_STRINGS = {
	conceptType: "Conversation",
	fallbackTitle: "Conversation",
	fallbackDescription: "A conversation with the KnowMe concierge.",
	userHeading: "You",
	assistantHeading: "KnowMe concierge",
	provenance: "Exported from KnowMe in the browser. This file was not uploaded anywhere.",
	incomplete: "_(this reply was incomplete)_",
	stopped: "_(this reply stopped before it finished)_",
	webSearchOn: "_Web search was on for this answer._",
	kbSourcePrefix: "KnowMe knowledge base: ",
	webSourceFallbackPrefix: "Web source: ",
	omittedCards: "cards",
	omittedImages: "images from other sites",
	redacted: "[removed]",
	bundleIndexTitle: "KnowMe conversations",
	bundleLogTitle: "Log",
	bundleUndated: "Undated",
} as const;

/** What the exporter dropped from one conversation that the visitor could see. */
export interface OmittedKinds {
	cards: boolean;
	images: boolean;
}

/** The one closing line of a conversation that lost visible content. Names kinds only, never the content. */
export function omissionLine(kinds: OmittedKinds): string {
	const named: string[] = [];
	if (kinds.cards) named.push(OKF_STRINGS.omittedCards);
	if (kinds.images) named.push(OKF_STRINGS.omittedImages);
	return `_Left out of this file: ${named.join(" and ")}._`;
}

/** The one `log.md` line of an export run (OKF Creation entry). Singular for one conversation. */
export function bundleCreationLine(count: number): string {
	const noun = count === 1 ? "conversation" : "conversations";
	return `**Creation** - Exported ${count} ${noun} from KnowMe in the browser. This file was not uploaded anywhere.`;
}

/** Bump when the exported shape changes. Appears in `generated.by`. */
export const OKF_EXPORT_FORMAT_VERSION = 1;

/** Own host the app turns same-origin image paths into (spec 7). */
export const OKF_PUBLIC_ORIGIN = "https://know-me.tools";
