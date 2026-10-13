/**
 * Operator-approved 2026-10-13, recorded in
 * `docs/content/reviews/site-ai-disclosure-label.md`. See that file before
 * changing this text.
 *
 * The EU AI Act Art. 50 disclosure label and the composer's sensitive-data
 * hint are the only source for this copy (site-ai-disclosure-label, tasks
 * 1.1-1.3). Components import from here so approval only ever means editing
 * this file, never the components that render it.
 */
export interface AiDisclosureContent {
	/** Identifies the agent as AI and warns that answers may be wrong. */
	label: string;
	/** Shown near the composer; asks the visitor not to share sensitive data. */
	sensitiveDataHint: string;
}

export const AI_DISCLOSURE_CONTENT: AiDisclosureContent = {
	label: "KnowMe Concierge — an AI assistant. Answers may be wrong.",
	sensitiveDataHint: "Please don't share sensitive personal details in this chat.",
};

/**
 * Operator-approved 2026-10-13, recorded in
 * `docs/content/reviews/site-ai-surface-caption.md`.
 *
 * The fixed, app-rendered caption under every A2UI surface (task 5.3, W3).
 * The app renders it outside the model's surface content, so no model output
 * can fill, replace or imitate it.
 */
export const AI_SURFACE_CAPTION = "AI-generated · check important details";
