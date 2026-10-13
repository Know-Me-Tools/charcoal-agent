/**
 * Operator-approved 2026-10-13, recorded in
 * `docs/content/reviews/site-preview-note.md`. Change this text only with a new review record.
 *
 * Shown under the toolbar of an HTML preview on the site build when the
 * previewed code contains scripts (site-reply-content-hardening, task 3.5
 * decision: option 1). The site's Content-Security-Policy blocks inline
 * scripts inside the preview frame, so the preview shows the page without
 * them. Components import from here so approval only means editing this file.
 */
export interface PreviewNoteContent {
  /** One short, factual sentence; no jargon. */
  scriptsBlocked: string;
}

export const PREVIEW_NOTE_CONTENT: PreviewNoteContent = {
  scriptsBlocked: "Scripts do not run in previews.",
};
