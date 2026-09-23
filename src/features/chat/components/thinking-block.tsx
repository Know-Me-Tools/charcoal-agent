import { BrainIcon, ChevronDownIcon } from "lucide-react";
import { type FC, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ThinkingBlockProps {
	text: string;
	isStreaming?: boolean;
}

export const ThinkingBlock: FC<ThinkingBlockProps> = ({
	text,
	isStreaming = false,
}) => {
	const [isOpen, setIsOpen] = useState(isStreaming);

	return (
		<div className="my-2 overflow-hidden rounded-lg border border-border/50 bg-muted/20">
			{/* Trigger */}
			<Button
				variant="ghost"
				onClick={() => setIsOpen((o) => !o)}
				className="flex h-auto w-full items-center justify-start gap-2 rounded-none px-3 py-2 hover:bg-muted/30"
				aria-expanded={isOpen}
			>
				<BrainIcon size={13} className="shrink-0 text-muted-foreground" />
				<span className="flex-1 font-mono text-[11px] text-muted-foreground">
					{isStreaming ? (
						<span className="flex items-center gap-2">
							{"// Reasoning"}
							<span className="inline-flex gap-0.5">
								<span className="h-1 w-1 animate-[shimmer_1.2s_ease-in-out_infinite] rounded-full bg-primary/60 [animation-delay:0s]" />
								<span className="h-1 w-1 animate-[shimmer_1.2s_ease-in-out_infinite] rounded-full bg-primary/60 [animation-delay:0.2s]" />
								<span className="h-1 w-1 animate-[shimmer_1.2s_ease-in-out_infinite] rounded-full bg-primary/60 [animation-delay:0.4s]" />
							</span>
						</span>
					) : (
						"// Reasoning"
					)}
				</span>
				<ChevronDownIcon
					size={13}
					className={cn(
						"shrink-0 text-muted-foreground transition-transform duration-150",
						isOpen && "rotate-180",
					)}
				/>
			</Button>

			{/* Content */}
			{isOpen && (
				<div className="border-t border-border/30 px-3 pb-3 pt-2">
					<p className="font-body text-[13px] leading-relaxed text-muted-foreground whitespace-pre-wrap">
						{text}
						{isStreaming && (
							<span className="ml-0.5 inline-block h-3.5 w-0.5 animate-blink-cursor bg-primary" />
						)}
					</p>
				</div>
			)}
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
