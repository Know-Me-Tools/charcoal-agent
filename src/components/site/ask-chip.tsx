import { MessageCircle } from "lucide-react";
import { useStartChat } from "@/hooks/use-start-chat";
import { cn } from "@/lib/utils";
import { ASK_CONCIERGE_CONTENT } from "../../../content/site/ask-concierge";

export interface AskChipProps {
	/** The question sent as the visitor's first message. */
	prompt: string;
	/**
	 * Compact form: show this word instead of the prompt (index rows show
	 * "Ask"). The accessible name then becomes "Ask the concierge: {prompt}".
	 * Omit it to show the whole question on the chip.
	 */
	label?: string;
	className?: string;
}

/**
 * A prompt chip: pressing it opens a new concierge thread with `prompt` as the
 * first message (docs/design/product-directory.md section 5.1). A native
 * button, at least 44 px tall.
 */
export function AskChip({ prompt, label, className }: AskChipProps) {
	const startChat = useStartChat();
	const name = label ? ASK_CONCIERGE_CONTENT.chipNameTemplate.replace("{prompt}", prompt) : undefined;

	return (
		<button
			type="button"
			onClick={() => startChat(prompt)}
			aria-label={name}
			className={cn(
				"inline-flex min-h-11 min-w-11 items-center gap-2 rounded-lg bg-cyan-soft px-3.5 py-2 text-left font-ui text-sm font-semibold leading-[1.35] text-cyan-text transition-hover hover:bg-hover focus-cue active:translate-y-px",
				className,
			)}
		>
			<MessageCircle className="size-4 shrink-0" aria-hidden="true" />
			{label ?? prompt}
		</button>
	);
}
