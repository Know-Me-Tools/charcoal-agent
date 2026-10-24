import { useAui } from "@assistant-ui/react";
import { MessageCircle } from "lucide-react";
import type { FC } from "react";

/**
 * A starter prompt on the empty conversation (site-concierge-opening). It looks
 * like the ask chip (`components/site/ask-chip.tsx`) but sends into the thread
 * that is already open, so the question becomes this thread's first message
 * instead of opening a second, empty one. A native button, 44 px tall; the
 * whole question is its name.
 */
export const StarterPromptChip: FC<{ prompt: string }> = ({ prompt }) => {
	const aui = useAui();
	return (
		<button
			type="button"
			onClick={() => aui.thread().append({ role: "user", content: [{ type: "text", text: prompt }] })}
			className="inline-flex min-h-11 min-w-11 items-center gap-2 rounded-lg bg-cyan-soft px-3.5 py-2 text-left font-ui text-sm font-semibold leading-[1.35] text-cyan-text transition-hover hover:bg-hover focus-cue active:translate-y-px"
		>
			<MessageCircle className="size-4 shrink-0" aria-hidden="true" />
			{prompt}
		</button>
	);
};
