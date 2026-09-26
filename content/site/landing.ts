import type { ApprovedTagline } from "../brand/taglines";

/**
 * A single FAQ entry inside a landing content section. No FAQ content ships
 * in this change (openspec/changes/landing-and-about-brand, task 1.2); this
 * type exists so a later change can add items without restructuring.
 */
export interface LandingFaqItem {
	question: string;
	answer: string;
}

/**
 * One topic section on the landing page, rendered as its own <section>,
 * named by its own h2 (the `heading` field). `label` is the short mono
 * kicker shown above the heading, matching the hero eyebrow treatment.
 */
export interface LandingSection {
	id: string;
	label: string;
	heading: string;
	body: string[];
	faq?: LandingFaqItem[];
}

export interface LandingContent {
	/** Mono kicker line above the hero h1. Not a tagline. */
	eyebrow: string;
	/** The hero h1. Must be a member of APPROVED_TAGLINES. */
	headline: ApprovedTagline;
	/** The value-line paragraph immediately after the h1. */
	valueLine: string;
	nav: {
		openAppLabel: string;
	};
	composer: {
		placeholder: string;
		sendLabel: string;
		hint: string;
		browseThreadsLabel: string;
	};
	sections: LandingSection[];
}

export const LANDING_CONTENT: LandingContent = {
	eyebrow: "// The KnowMe agent",
	headline: "AI that understands you.",
	valueLine:
		"The KnowMe agent runs on the Universal Agent Runtime. Type below and start talking.",
	nav: {
		openAppLabel: "Open app",
	},
	composer: {
		placeholder: "What's on your mind?",
		sendLabel: "Send",
		hint: "↵ to send",
		browseThreadsLabel: "Browse threads",
	},
	sections: [
		{
			id: "threads",
			label: "Threads",
			heading: "Every conversation, kept.",
			body: [
				"Each chat becomes a thread, saved on your device, so you can pick up right where you left off.",
			],
		},
		{
			id: "skills",
			label: "Skills",
			heading: "Skills you can attach.",
			body: [
				"The KnowMe agent runs on the Universal Agent Runtime. Skills attach to it, extending what it can do.",
			],
		},
		{
			id: "everywhere",
			label: "Everywhere",
			heading: "In your browser, or on your desktop.",
			body: [
				"KnowMe runs as a web app, and the same interface runs as a desktop app built with Tauri. Either way, you're talking to the KnowMe agent on the Universal Agent Runtime.",
			],
		},
	],
};
