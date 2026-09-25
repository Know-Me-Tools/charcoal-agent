import { BrainIcon, ChevronDownIcon } from "lucide-react";
import { type FC, useState } from "react";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

interface ThinkingBlockProps {
	text: string;
	isStreaming?: boolean;
}

export const ThinkingBlock: FC<ThinkingBlockProps> = ({
	text,
	isStreaming = false,
}) => {
	// Collapsed by default even while streaming (design spec §7.5, §7.1).
	const [isOpen, setIsOpen] = useState(false);

	return (
		<div className="my-3 overflow-hidden rounded-lg bg-cyan-soft first:mt-0 last:mb-0">
			<Collapsible open={isOpen} onOpenChange={setIsOpen}>
				<CollapsibleTrigger
					render={
						<Button
							variant="ghost"
							className="flex h-auto w-full items-center justify-start gap-2 whitespace-normal rounded-lg px-3 py-2 text-left hover:bg-hover focus-cue"
						/>
					}
				>
					<BrainIcon className="size-3.5 shrink-0 text-cyan-text" aria-hidden="true" />
					<span className="flex flex-1 items-center gap-2 font-ui text-xs font-semibold text-cyan-text">
						{isStreaming ? "Thinking" : "Reasoning"}
						{isStreaming && (
							<span className="inline-flex gap-1" aria-hidden="true">
								<span className="size-1 animate-shimmer rounded-full bg-cyan [animation-delay:0ms]" />
								<span className="size-1 animate-shimmer rounded-full bg-cyan [animation-delay:150ms]" />
								<span className="size-1 animate-shimmer rounded-full bg-cyan [animation-delay:300ms]" />
							</span>
						)}
					</span>
					<ChevronDownIcon
						className={cn(
							"size-3.5 shrink-0 text-cyan-text transition-transform duration-(--km-duration-fast) ease-brand-out",
							isOpen && "rotate-180",
						)}
						aria-hidden="true"
					/>
				</CollapsibleTrigger>
				<CollapsibleContent className="px-3 pb-3 transition-opacity duration-(--km-duration-fast) ease-brand-out data-[starting-style]:opacity-0 data-[ending-style]:opacity-0">
					<p className="whitespace-pre-wrap font-body text-sm text-fg-secondary leading-relaxed wrap-break-word">
						{text}
						{isStreaming && isOpen && (
							<span
								className="ms-1 inline-block size-1.5 animate-shimmer rounded-full bg-cyan align-middle"
								aria-hidden="true"
							/>
						)}
					</p>
				</CollapsibleContent>
			</Collapsible>
		</div>
	);
};

// Wrapper that matches assistant-ui's Reasoning component interface
// Used in MessagePrimitive.Parts components map
export const AssistantUIThinkingBlock: FC = () => {
	// This is consumed by assistant-ui — it reads the content part internally
	// We re-export a UI-only version; the actual text comes from context
	return <ThinkingBlock text="" isStreaming={false} />;
};
