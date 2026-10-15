/**
 * Fixed text the exported file carries. DRAFT: the visitor-facing wording is
 * pending chief-content-officer review and operator approval (task 4.5, spec
 * section 9). Wording makes no claim beyond what the product does: the file is
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
	redacted: "[removed]",
} as const;

/** Bump when the exported shape changes. Appears in `generated.by`. */
export const OKF_EXPORT_FORMAT_VERSION = 1;

/** Own host the app turns same-origin image paths into (spec 7). */
export const OKF_PUBLIC_ORIGIN = "https://know-me.tools";
