import { AlertTriangleIcon, CheckIcon, CopyIcon } from "lucide-react";
import type { FC } from "react";
import { TooltipIconButton } from "@/components/assistant-ui/tooltip-icon-button";
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard";
import { cn } from "@/lib/utils";
import { BLOCK_COPY_CONTENT } from "../../../content/site/block-copy";

export interface CopyButtonProps {
	/** The exact text placed on the clipboard (the block's data, not DOM text). */
	text: string;
	/** Accessible name, naming the block: "Copy code", "Copy diagram source", ... */
	label: string;
	/**
	 * Called when the clipboard write fails, so the block can select its own
	 * text for a manual copy. Optional: the "Couldn't copy" state shows either
	 * way.
	 */
	selectFallback?: () => void;
	/**
	 * "icon" is a tooltip icon button for card toolbars; "labeled" is icon +
	 * text for block headers. Both are 32 px from 768 px and 44 px below,
	 * following the web-search toggle's `max-md` pattern.
	 */
	variant?: "icon" | "labeled";
	className?: string;
}

/**
 * The one Copy control every block uses (spec
 * `docs/specs/chat-export-okf-and-block-copy.md` section 7).
 *
 * - Success: check icon and "Copied", announced through a polite live region,
 *   resetting after 2.5 s.
 * - Failure (no clipboard API, insecure context, denied permission, unfocused
 *   document): never throws and never rejects unhandled; shows "Couldn't
 *   copy" and runs `selectFallback` so the block's text is selected.
 * - State is never colour alone: the icon and the text both change, and the
 *   live region announces it. No animation beyond the shared hover
 *   transition; a real `<button>`, so Enter and Space activate it.
 */
export const CopyButton: FC<CopyButtonProps> = ({ text, label, selectFallback, variant = "icon", className }) => {
	const { status, copy } = useCopyToClipboard({ selectFallback });

	const stateText =
		status === "copied"
			? BLOCK_COPY_CONTENT.copied
			: status === "failed"
				? BLOCK_COPY_CONTENT.copyFailed
				: "";

	const icon =
		status === "copied" ? (
			<CheckIcon className="size-3.5 text-success-text" aria-hidden="true" />
		) : status === "failed" ? (
			<AlertTriangleIcon className="size-3.5 text-danger-text" aria-hidden="true" />
		) : (
			<CopyIcon className="size-3.5" aria-hidden="true" />
		);

	// One polite live region per button; empty while idle so only the state
	// change is announced, not the label.
	const liveRegion = (
		<span role="status" className="sr-only">
			{stateText}
		</span>
	);

	if (variant === "labeled") {
		return (
			<>
				<button
					type="button"
					aria-label={label}
					onClick={() => {
						void copy(text);
					}}
					className={cn(
						"inline-flex h-8 items-center gap-1 rounded-sm px-2 font-ui text-xs font-semibold text-fg-secondary transition-hover hover:bg-hover hover:text-fg focus-cue max-md:min-h-11 max-md:px-3",
						status === "failed" && "text-danger-text hover:text-danger-text",
						className,
					)}
				>
					{icon}
					<span>{status === "idle" ? BLOCK_COPY_CONTENT.copy : stateText}</span>
				</button>
				{liveRegion}
			</>
		);
	}

	return (
		<>
			<TooltipIconButton
				tooltip={status === "idle" ? label : stateText}
				aria-label={label}
				onClick={() => {
					void copy(text);
				}}
				className={cn("max-md:size-11", className)}
			>
				{icon}
			</TooltipIconButton>
			{liveRegion}
		</>
	);
};
