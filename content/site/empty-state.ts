/**
 * DRAFT copy — pending operator approval and the chief content officer's
 * pre-review. Do not treat as final; a review record for this piece belongs
 * in `docs/content/reviews/site-empty-state.md` before it ships.
 *
 * The public site's empty conversation and composer placeholder
 * (site-shell-about-panel-and-empty-state, task 6.3). The AI note is not
 * duplicated here: the empty state renders `AI_DISCLOSURE_CONTENT.label`
 * from `ai-disclosure.ts`. No starter prompts yet (change 07).
 *
 * The product list matches the knowledge-source titles under
 * `docs/knowledge-source/`. Only KnowMe, The Boss and IPFS Sync for Obsidian
 * have their own document in the published `content/knowledge/` today; the
 * others are published by change 14, so this copy should ship with or after it.
 */
import type { ApprovedTagline } from "../brand/taglines";

export interface EmptyStateContent {
	/** Approved tagline, verbatim (tagline role). */
	heading: ApprovedTagline;
	/** One sentence on what the assistant can answer. */
	description: string;
	/** Composer placeholder on the site build. */
	composerPlaceholder: string;
}

export const EMPTY_STATE_CONTENT: EmptyStateContent = {
	heading: "AI that understands you.",
	description:
		"Ask about KnowMe, The Boss, the Universal Agent Runtime, BossFang, the Surreal Memory Server, the Prometheus skill packages or IPFS Sync for Obsidian.",
	composerPlaceholder: "Ask about KnowMe, The Boss and the other products",
};
