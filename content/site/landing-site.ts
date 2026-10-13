/**
 * Operator-approved 2026-10-13, recorded in
 * `docs/content/reviews/site-landing.md`. Change this text only with a new review record.
 *
 * The public site's front page (integration gate 08, B1). It replaces the app
 * landing (`landing.ts`) on the site build, whose "Skills you can attach",
 * "Open app" and Tauri desktop claims describe the app, not this site. Claims
 * stay inside PRODUCT.md and decision-log D-8 / D-10 and the About panel:
 * the site is the front door to KnowMe AI, LLC's products; conversations are
 * stored in this browser and messages go to a cloud language model; The Boss
 * is free, open source and downloadable now; KnowMe is not yet released. No
 * pricing, no compliance claim, no skills or desktop claim, no "Open app".
 */
import type { ApprovedTagline } from "../brand/taglines";
import { EMPTY_STATE_CONTENT } from "./empty-state";
import type { LandingSection } from "./landing";

/** A paragraph that ends in a link, shown before the section's body paragraphs. */
export interface SiteLandingLink {
	/** Sentence text before the link. */
	lead: string;
	/** Visible link text. */
	label: string;
	href: string;
	/** Sentence text after the link. */
	trail: string;
	/** Screen-reader suffix on the link, which opens a new tab. */
	opensInNewTab: string;
}

export interface SiteLandingSection extends LandingSection {
	link?: SiteLandingLink;
}

export interface SiteLandingContent {
	/** Mono kicker line above the hero h1. Not a tagline. */
	eyebrow: string;
	/** The hero h1. Must be a member of APPROVED_TAGLINES. */
	headline: ApprovedTagline;
	/** The value-line paragraph immediately after the h1. */
	valueLine: string;
	composer: {
		placeholder: string;
		sendLabel: string;
	};
	/** At most three sections. */
	sections: readonly SiteLandingSection[];
}

export const SITE_LANDING_CONTENT: SiteLandingContent = {
	eyebrow: "// KnowMe AI, LLC",
	headline: "AI that understands you.",
	valueLine:
		"This site is the front door to the products of KnowMe AI, LLC. Ask the concierge about any of them, and go as deep as you like.",
	composer: {
		// Same placeholder as the site's own conversation composer.
		placeholder: EMPTY_STATE_CONTENT.composerPlaceholder,
		sendLabel: "Send",
	},
	sections: [
		{
			id: "products",
			label: "Products",
			heading: "Ask about the products.",
			body: [
				"KnowMe, The Boss and IPFS Sync for Obsidian, and the technologies they are built on. The concierge answers from a curated knowledge base and cites its sources.",
			],
		},
		{
			id: "your-conversations",
			label: "Your conversations",
			heading: "Your conversations stay in your browser.",
			body: [
				"Your conversations are stored in this browser. To compose an answer, your messages are sent to a cloud language model.",
			],
		},
		{
			id: "the-boss",
			label: "Available now",
			heading: "The Boss is available now.",
			body: ["KnowMe itself is not yet released."],
			link: {
				lead: "The Boss, the desktop app, is free and open source. Download it from",
				label: "the-boss.know-me.tools",
				href: "https://the-boss.know-me.tools",
				trail: ".",
				opensInNewTab: "(opens in a new tab)",
			},
		},
	],
};
