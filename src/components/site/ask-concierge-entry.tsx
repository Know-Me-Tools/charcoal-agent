import { MessageCircle } from "lucide-react";
import { ASK_COMPOSER_ATTRIBUTE } from "@/components/site/ask-composer-attribute";
import { useStartChat } from "@/hooks/use-start-chat";
import { ASK_CONCIERGE_CONTENT } from "../../../content/site/ask-concierge";

/**
 * The header's persistent "Ask the concierge" entry (docs/design/product-directory.md
 * section 5.3). If the page has a composer (a field marked `data-ask-composer`),
 * it scrolls there and focuses it; otherwise it opens a new thread with no
 * prompt. Icon-only below 640 px; the accessible name is the same at every
 * width. Mount it on non-thread pages only.
 */
export function AskConciergeEntry() {
	const startChat = useStartChat();

	const handleClick = () => {
		const composer = document.querySelector<HTMLElement>(`[${ASK_COMPOSER_ATTRIBUTE}]`);
		if (composer) {
			composer.scrollIntoView({ block: "center" });
			composer.focus();
			return;
		}
		startChat();
	};

	return (
		<button
			type="button"
			onClick={handleClick}
			aria-label={ASK_CONCIERGE_CONTENT.headerLabel}
			className="inline-flex h-11 min-w-11 items-center justify-center gap-2 rounded-lg px-3 font-ui text-sm font-semibold text-fg transition-hover hover:bg-hover focus-cue"
		>
			<MessageCircle className="size-[1.125rem] text-cyan-text" aria-hidden="true" />
			<span className="hidden sm:inline">{ASK_CONCIERGE_CONTENT.headerLabel}</span>
		</button>
	);
}
