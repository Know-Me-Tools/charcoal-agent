/**
 * Heading approved 2026-10-13 (`docs/content/reviews/site-empty-state.md`).
 * The description, composer placeholder and starter prompts were rewritten for
 * the whole portfolio by site-concierge-opening: DRAFT, pending operator
 * approval, recorded in `docs/content/reviews/site-concierge-opening.md`.
 * Change this text only with a new review record.
 *
 * The public site's empty conversation and composer placeholder
 * (site-shell-about-panel-and-empty-state, task 6.3). The AI note is not
 * duplicated here: the empty state renders `AI_DISCLOSURE_CONTENT.label`
 * from `ai-disclosure.ts`.
 *
 * The opening names the six portfolio families (docs/design/product-directory.md section 3.1) and what
 * the concierge answers from. Each starter prompt is a question a visitor would
 * ask, follows docs/design/product-directory.md section 5.2 (a question, at most
 * 70 characters, no claim, no price) and is answered by a page of
 * `content/knowledge/` (portfolio-overview, portfolio-available-today or
 * portfolio-stated-relationships).
 */
import type { ApprovedTagline } from "../brand/taglines";

export interface EmptyStateContent {
	/** Approved tagline, verbatim (tagline role). */
	heading: ApprovedTagline;
	/** What the assistant can talk about and what it answers from. */
	description: string;
	/** Composer placeholder on the site build. */
	composerPlaceholder: string;
	/** Chips under the description; pressing one sends the question as the first message. */
	starterPrompts: readonly string[];
}

export const EMPTY_STATE_CONTENT: EmptyStateContent = {
	heading: "AI that understands you.",
	description:
		"Ask about the KnowMe and Prometheus portfolio: apps, agents and memory, platform, developer tools, integrations, services and research. Answers come from the site's knowledge base; a product that is only a design is called a design.",
	composerPlaceholder: "Ask about a KnowMe or Prometheus product",
	starterPrompts: [
		"What products does KnowMe AI make?",
		"What can I use today?",
		"How do your products relate to each other?",
		"Which apps and agents exist, and how far along are they?",
		"What platform and developer tools are there?",
		"What integrations, services and research are there?",
	],
};
