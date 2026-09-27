/**
 * The five approved KnowMe taglines, verbatim.
 *
 * Source: KnowMe Brand Guide v1.0, §11 "Approved Taglines"
 * File:   know-me/branding/knowme-brand-guide.html, lines 1553-1557
 *
 * Every tagline-role string on a brand page (the landing hero headline, and
 * any other text styled or labelled as a tagline) must be a member of this
 * list, compared by exact string. Do not add, edit or reorder these without
 * a change to the Brand Guide itself.
 */
export const APPROVED_TAGLINES = [
	"AI that understands you.",
	"Your personal intelligence.",
	"Deeply personal AI.",
	"Know yourself. Grow yourself.",
	"Intelligence, intimate.",
] as const;

export type ApprovedTagline = (typeof APPROVED_TAGLINES)[number];
