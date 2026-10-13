/**
 * Operator-approved 2026-10-13, recorded in
 * `docs/content/reviews/site-about-panel.md`. Change this text only with a new review record.
 *
 * The public site's About / Sources panel (site-shell-about-panel-and-empty-state,
 * task 6.2), which replaces the app's agent Context panel on the site build.
 * Claims stay inside PRODUCT.md and decision-log D-8 / D-10: no pricing, no
 * availability beyond The Boss being downloadable now, no privacy promise
 * stronger than "stored in your browser". Components import from here so
 * approval only ever means editing this file.
 */
export interface AboutPanelLink {
	/** Sentence text before the link. */
	lead: string;
	/** Visible link text. */
	label: string;
	href: string;
}

export interface AboutPanelContent {
	/** Panel title, the inline panel's accessible name, and the top-bar toggle's label. */
	title: string;
	/** Accessible name of the panel's and the sheet's close button. */
	closeLabel: string;
	sources: {
		heading: string;
		/** Shown while the conversation has no cited sources yet. */
		empty: string;
		/** Screen-reader suffix on a source link that opens a new tab. */
		opensInNewTab: string;
	};
	about: {
		heading: string;
		paragraphs: readonly string[];
		theBoss: AboutPanelLink;
	};
}

export const ABOUT_PANEL_CONTENT: AboutPanelContent = {
	title: "About and sources",
	closeLabel: "Close about and sources",
	sources: {
		heading: "Sources",
		empty: "When an answer cites the knowledge base, its sources are listed here.",
		opensInNewTab: "(opens in a new tab)",
	},
	about: {
		heading: "About this assistant",
		paragraphs: [
			"This is an AI assistant for KnowMe AI, LLC. Its answers come from a curated knowledge base about the company and its products.",
			"It can only answer questions. It cannot act for you, and it cannot pass a message on to a person.",
			"Your conversations are stored in this browser. To compose an answer, your messages are sent to a cloud language model.",
		],
		theBoss: {
			lead: "The Boss, the desktop app, is free and open source. Download it from",
			label: "the-boss.know-me.tools",
			href: "https://the-boss.know-me.tools",
		},
	},
};
