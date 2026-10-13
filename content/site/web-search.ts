/**
 * DRAFT, pending the operator's approval of the privacy wording (OD-7 of the
 * `site-web-search` change). Nothing here is approved; every visitor-facing
 * string of the web-search toggle and the web-source label lives in this one
 * file so approval means editing this file only. Proposed text follows
 * `openspec/changes/site-web-search/design.md` section 8.
 *
 * Web search is OFF by default. The visitor turns it on with a toggle in the
 * chat composer; only then does a question go to a third-party search service.
 */
export interface WebSearchContent {
	/** Visible name and accessible name of the composer toggle. */
	toggleLabel: string;
	/**
	 * Tooltip and accessible description of the toggle. States that, when the
	 * toggle is on, the question is sent to a third-party search service.
	 */
	tooltip: string;
	/** Screen-reader state text appended to the toggle's description. */
	stateOn: string;
	stateOff: string;
	/** The visible badge on a web source in the Sources block and the panel. */
	sourceLabel: string;
	/** Title of an in-reply `[Wn]` marker that resolves; `{host}` is the source host. */
	markerTitle: string;
}

export const WEB_SEARCH_CONTENT: WebSearchContent = {
	toggleLabel: "Search the web",
	tooltip:
		"Off by default. When on, the words of your question are sent to a third-party search service, and web sources are marked Web.",
	stateOn: "On",
	stateOff: "Off",
	sourceLabel: "Web",
	markerTitle: "Web source from {host}",
};
