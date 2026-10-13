/**
 * DRAFT copy — pending the operator and the content officer. Do not treat as
 * final; a review record for this piece belongs in
 * `docs/content/reviews/site-thread-list.md` before it ships.
 *
 * The site sidebar's thread list when the visitor has no conversation at all
 * (integration gate 08, S1). It replaces the app's "// No threads yet / Start
 * a new thread to begin" on the site build. The storage claim matches the
 * About panel ("stored in this browser") and goes no further.
 */
export interface ThreadListContent {
	/** Mono kicker shown when there is no conversation at all. */
	emptyLabel: string;
	/** One line under the kicker. */
	emptyHint: string;
}

export const THREAD_LIST_CONTENT: ThreadListContent = {
	emptyLabel: "// No conversations yet",
	emptyHint: "Ask a question to start one. Conversations are stored in this browser.",
};
