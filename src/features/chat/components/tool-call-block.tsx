import {
	CheckCircle2Icon,
	ChevronDownIcon,
	Loader2Icon,
	WrenchIcon,
	XCircleIcon,
	type LucideIcon,
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

// Status pill anatomy: icon + text label on a status token (design spec §5).
// Running is cyan (the AI working), not amber.
const statusConfig: Record<
	ToolStatus,
	{ Icon: LucideIcon; label: string; fillClass: string; toneClass: string; spin?: boolean }
> = {
	running: {
		Icon: Loader2Icon,
		label: "Running",
		fillClass: "bg-cyan-soft",
		toneClass: "text-cyan-text",
		spin: true,
	},
	complete: {
		Icon: CheckCircle2Icon,
		label: "Completed",
		fillClass: "bg-success-soft",
		toneClass: "text-success-text",
	},
	failed: {
		Icon: XCircleIcon,
		label: "Failed",
		fillClass: "bg-danger-soft",
		toneClass: "text-danger-text",
	},
};

/** Pretty-prints a JSON result string; returns null when it does not parse. */
function tryFormatJson(value: string): string | null {
	try {
		return JSON.stringify(JSON.parse(value), null, 2);
	} catch {
		return null;
	}
}

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
	const resultJson = result !== undefined ? tryFormatJson(result) : null;

	return (
		<div className="my-3 min-w-0 overflow-hidden rounded-lg bg-surface first:mt-0 last:mb-0">
			{/* Header row */}
			<Button
				variant="ghost"
				onClick={() => setIsExpanded((e) => !e)}
				className="flex h-auto w-full items-start justify-start gap-2 whitespace-normal rounded-none px-3 py-2.5 text-left hover:bg-hover focus-cue"
				aria-expanded={isExpanded}
			>
				<WrenchIcon className="mt-0.5 size-3.5 shrink-0 text-fg-secondary" aria-hidden="true" />

				<span className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-1">
					{/* Tool name — wraps rather than truncating (320px overflow fix) */}
					<span className="min-w-0 font-mono text-xs font-semibold text-fg wrap-anywhere">
						{toolName}
					</span>

					{/* Status pill */}
					<span
						className={cn(
							"inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-pill px-2.5 py-1 font-ui text-xs font-semibold leading-none",
							config.fillClass,
							config.toneClass,
						)}
					>
						<Icon className={cn("size-3.5 shrink-0", config.spin && "animate-spin")} aria-hidden="true" />
						<span>{config.label}</span>
					</span>
				</span>

				<ChevronDownIcon
					className={cn(
						"mt-0.5 size-3.5 shrink-0 text-fg-secondary transition-transform duration-150",
						isExpanded && "rotate-180",
					)}
					aria-hidden="true"
				/>
			</Button>

			{/* Expanded content */}
			{isExpanded && (
				<div className="space-y-3 px-3 pb-3">
					{hasArgs && (
						<div>
							<p className="mb-1.5 font-ui text-xs font-semibold text-fg-secondary">Input</p>
							<ShikiCodeBlock code={argsJson} language="json" />
						</div>
					)}

					{result !== undefined && (
						<div>
							<p className="mb-1.5 font-ui text-xs font-semibold text-fg-secondary">Result</p>
							{status === "failed" ? (
								<p className="whitespace-pre-wrap rounded-md bg-danger-soft px-3 py-2 font-body text-sm text-danger-text wrap-break-word">
									{result}
								</p>
							) : resultJson !== null ? (
								<ShikiCodeBlock code={resultJson} language="json" />
							) : (
								<p className="whitespace-pre-wrap font-body text-sm leading-relaxed text-fg wrap-break-word">
									{result}
								</p>
							)}
						</div>
					)}

					{status === "running" && result === undefined && (
						<p className="font-mono text-xs text-faint">Waiting for result</p>
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
					: result !== undefined && result !== null
						? JSON.stringify(result)
						: undefined
			}
			status={toolStatus}
		/>
	);
};
