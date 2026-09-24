import {
	CheckCircle2Icon,
	ChevronDownIcon,
	Loader2Icon,
	WrenchIcon,
	XCircleIcon,
} from "lucide-react";
import { type FC, useState } from "react";
import { Button } from "@/components/ui/button";
import { ShikiCodeBlock } from "@/features/artifacts/shiki-code-block";
import { cn } from "@/lib/utils";

export type ToolStatus = "running" | "complete" | "failed";

interface ToolCallBlockProps {
	toolName: string;
	args: Record<string, unknown>;
	result?: string;
	status: ToolStatus;
	toolCallId?: string;
}

const statusConfig = {
	running: {
		Icon: Loader2Icon,
		label: "running",
		iconClass: "animate-spin text-warning-text",
		badgeClass: "bg-warning/10 text-warning-text",
	},
	complete: {
		Icon: CheckCircle2Icon,
		label: "complete",
		iconClass: "text-success-text",
		badgeClass: "bg-success/10 text-success-text",
	},
	failed: {
		Icon: XCircleIcon,
		label: "failed",
		iconClass: "text-danger-text",
		badgeClass: "bg-destructive/10 text-danger-text",
	},
} as const;

export const ToolCallBlock: FC<ToolCallBlockProps> = ({
	toolName,
	args,
	result,
	status,
}) => {
	const [isExpanded, setIsExpanded] = useState(false);
	const config = statusConfig[status];
	const { Icon } = config;

	const argsJson = JSON.stringify(args, null, 2);
	const hasArgs = argsJson !== "{}";

	return (
		<div className="my-2 overflow-hidden rounded-lg border border-border/50 bg-card">
			{/* Header row */}
			<Button
				variant="ghost"
				onClick={() => setIsExpanded((e) => !e)}
				className="flex h-auto w-full items-center justify-start gap-2.5 rounded-none px-3 py-2.5 hover:bg-muted/20"
				aria-expanded={isExpanded}
			>
				<WrenchIcon size={13} className="shrink-0 text-ember-text" />

				{/* Tool name */}
				<span className="font-mono text-[12px] font-medium text-ember-text">
					{toolName}
				</span>

				{/* Status badge */}
				<span
					className={cn(
						"ml-auto flex items-center gap-1 rounded-full px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide",
						config.badgeClass,
					)}
				>
					<Icon size={10} className={config.iconClass} />
					{config.label}
				</span>

				<ChevronDownIcon
					size={13}
					className={cn(
						"shrink-0 text-muted-foreground transition-transform duration-150",
						isExpanded && "rotate-180",
					)}
				/>
			</Button>

			{/* Expanded content */}
			{isExpanded && (
				<div className="divide-y divide-border/30 border-t border-border/30">
					{hasArgs && (
						<div className="px-3 pb-3 pt-2">
							<p className="mb-1.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
								{"// Arguments"}
							</p>
							<ShikiCodeBlock
								code={argsJson}
								language="json"
								className="text-[11px]"
							/>
						</div>
					)}

					{result && (
						<div className="px-3 pb-3 pt-2">
							<p className="mb-1.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
								{"// Result"}
							</p>
							<p className="font-body text-[13px] leading-relaxed text-muted-foreground">
								{result}
							</p>
						</div>
					)}

					{status === "running" && !result && (
						<div className="px-3 py-2">
							<p className="font-mono text-[11px] text-muted-foreground">
								Waiting for result…
							</p>
						</div>
					)}
				</div>
			)}
		</div>
	);
};

// Assistant-ui compatible wrapper — reads from the content part context
export const ToolCallBlockWrapper: FC<{
	toolName: string;
	args: Record<string, unknown>;
	result?: unknown;
	status?: { type: string };
}> = ({ toolName, args, result, status }) => {
	const toolStatus: ToolStatus =
		status?.type === "running"
			? "running"
			: status?.type === "incomplete"
				? "failed"
				: "complete";

	return (
		<ToolCallBlock
			toolName={toolName}
			args={args}
			result={
				typeof result === "string"
					? result
					: result
						? JSON.stringify(result)
						: undefined
			}
			status={toolStatus}
		/>
	);
};
