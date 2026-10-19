import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { prefetchThreadRoutes } from "@/lib/route-chunks";
import { useThreadRegistryStore } from "@/stores/thread-registry-store";
import { RESUME_CHAT_CONTENT } from "../../../content/site/resume-chat";

/**
 * Front-page link to the visitor's most recently updated saved conversation.
 * Renders nothing until the saved chats have been read (`hydrated`; the site
 * header's `useHasSavedChats` starts that read) and nothing when there is no
 * saved, non-ephemeral conversation, so it never flashes in a wrong state.
 *
 * A real link, secondary in weight to the ember send control: a `surface` fill
 * (Flat 2.0, no border or shadow), 44 px high, `focus-cue`. From `lg` up the
 * hero's columns are bottom-aligned, so an in-flow link would push the composer
 * up when it appears; there it hangs below the column (the hero's bottom padding
 * holds it) and nothing moves. The parent column is `lg:relative`. A plain element
 * rather than the `Button` primitive for the same reason as the other site
 * controls (see `ember-cta.ts`).
 */
export function ResumeChatLink() {
	const latestId = useThreadRegistryStore((s) => (s.hydrated ? (s.getLatestPersisted()?.id ?? null) : null));

	if (!latestId) return null;

	return (
		<Link
			to={`/threads/${latestId}`}
			onPointerEnter={prefetchThreadRoutes}
			onFocus={prefetchThreadRoutes}
			className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-lg bg-surface px-4 py-2 font-ui text-sm font-semibold text-fg transition-hover hover:bg-hover focus-cue lg:absolute lg:top-full lg:left-0"
		>
			{RESUME_CHAT_CONTENT.label}
			<ArrowRight className="size-4 shrink-0" aria-hidden="true" />
		</Link>
	);
}
