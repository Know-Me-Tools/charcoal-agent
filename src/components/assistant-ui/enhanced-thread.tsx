import {
	ActionBarMorePrimitive,
	ActionBarPrimitive,
	AuiIf,
	BranchPickerPrimitive,
	ComposerPrimitive,
	ErrorPrimitive,
	MessagePrimitive,
	ThreadPrimitive,
	type ToolCallMessagePartProps,
	useMessagePartText,
	useMessageRuntime,
} from "@assistant-ui/react";
import {
	ArrowDownIcon,
	ArrowUpIcon,
	BrainIcon,
	CheckIcon,
	ChevronDownIcon,
	ChevronLeftIcon,
	ChevronRightIcon,
	CopyIcon,
	DownloadIcon,
	MoreHorizontalIcon,
	PencilIcon,
	RefreshCwIcon,
	SparklesIcon,
	SquareIcon,
	UserIcon,
	ZapIcon,
	ZapOffIcon,
} from "lucide-react";
import { type FC, useState } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
	ComposerAddAttachment,
	ComposerAttachments,
	UserMessageAttachments,
} from "@/components/assistant-ui/attachment";
import { EnhancedMarkdownText } from "@/components/assistant-ui/enhanced-markdown-text";
import { TooltipIconButton } from "@/components/assistant-ui/tooltip-icon-button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";
import { ArtifactBlock } from "@/features/chat/components/artifact-block";
import { A2uiInputBlock, A2uiDisplayBlock } from "@/features/chat/components/a2ui-artifact-block";
import { ContextUpdateBlock } from "@/features/chat/components/context-update-block";
import { MemoryMutationBlock, MemoryRecallBlock } from "@/features/chat/components/memory-block";
import { SkillActivationBlock } from "@/features/chat/components/skill-activation-block";
import { ToolCallBlockWrapper } from "@/features/chat/components/tool-call-block";
import { CitationBlock } from "@/features/chat/components/citation-block";
import { cn } from "@/lib/utils";

// ─── Root Thread ─────────────────────────────────────────────────────────────

interface EnhancedThreadProps {
	/** Current session-level prompt-caching override (undefined = inherit). */
	promptCachingEnabled?: boolean;
	/** Called when the user clicks the prompt-caching toggle in the toolbar. */
	onTogglePromptCaching?: () => void;
}

export const EnhancedThread: FC<EnhancedThreadProps> = ({
	promptCachingEnabled,
	onTogglePromptCaching,
}) => {
	return (
		<ThreadPrimitive.Root
			className="aui-root aui-thread-root @container flex h-full flex-col bg-background"
			style={{ ["--thread-max-width" as string]: "48rem" }}
		>
			<ThreadPrimitive.Viewport
				turnAnchor="top"
				className="aui-thread-viewport relative flex flex-1 flex-col overflow-x-auto overflow-y-scroll scroll-smooth px-4 pt-4"
			>
				<AuiIf condition={(s) => s.thread.isEmpty}>
					<KnowMeWelcome />
				</AuiIf>

				<ThreadPrimitive.Messages
					components={{
						UserMessage,
						EditComposer,
						AssistantMessage,
					}}
				/>

				<ThreadPrimitive.ViewportFooter className="aui-thread-viewport-footer sticky bottom-0 mx-auto mt-auto flex w-full max-w-(--thread-max-width) flex-col gap-4 overflow-visible rounded-t-3xl bg-background pb-4 md:pb-6">
					<ThreadScrollToBottom />
					<EnhancedComposer
						promptCachingEnabled={promptCachingEnabled}
						onTogglePromptCaching={onTogglePromptCaching}
					/>
				</ThreadPrimitive.ViewportFooter>
			</ThreadPrimitive.Viewport>
		</ThreadPrimitive.Root>
	);
};

// ─── Welcome Screen ───────────────────────────────────────────────────────────

const KnowMeWelcome: FC = () => {
	return (
		<div className="mx-auto my-auto flex w-full max-w-(--thread-max-width) grow flex-col">
			<div className="flex w-full grow flex-col items-center justify-center">
				<div className="flex size-full flex-col items-center justify-center gap-4 px-4 text-center">
					{/* Brand mark */}
					<div className="flex items-center justify-center rounded-2xl border border-border/50 bg-muted/30 p-4">
						<SparklesIcon size={28} className="text-primary" />
					</div>

					<div className="space-y-1">
						<h1 className="font-display font-semibold text-2xl tracking-tight text-foreground">
							KnowMe
						</h1>
						<p className="font-mono text-[11px] text-primary">
							{"// No threads yet"}
						</p>
					</div>

					<p className="max-w-sm font-body text-sm text-muted-foreground leading-relaxed">
						Ask anything. Your agent is ready to think, research, and act on
						your behalf.
					</p>

					<p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground/50">
						Start a new thread
					</p>
				</div>
			</div>
		</div>
	);
};

// ─── Scroll to bottom ─────────────────────────────────────────────────────────

const ThreadScrollToBottom: FC = () => (
	<ThreadPrimitive.ScrollToBottom asChild>
		<TooltipIconButton
			tooltip="Scroll to bottom"
			variant="outline"
			className="absolute -top-12 z-10 self-center rounded-full p-4 disabled:invisible dark:bg-background dark:hover:bg-accent"
		>
			<ArrowDownIcon />
		</TooltipIconButton>
	</ThreadPrimitive.ScrollToBottom>
);

// ─── Composer ────────────────────────────────────────────────────────────────

interface ComposerProps {
	promptCachingEnabled?: boolean;
	onTogglePromptCaching?: () => void;
}

const EnhancedComposer: FC<ComposerProps> = ({ promptCachingEnabled, onTogglePromptCaching }) => (
	<ComposerPrimitive.Root className="relative flex w-full flex-col">
		<ComposerPrimitive.AttachmentDropzone className="flex w-full flex-col rounded-2xl border border-input bg-background/80 px-1 pt-2 backdrop-blur-sm outline-none transition-shadow has-[textarea:focus-visible]:border-ring has-[textarea:focus-visible]:ring-2 has-[textarea:focus-visible]:ring-ring/20 data-[dragging=true]:border-ring data-[dragging=true]:border-dashed data-[dragging=true]:bg-accent/50">
			<ComposerAttachments />
			<ComposerPrimitive.Input
				placeholder="Ask your agent anything…"
				className="mb-1 max-h-48 min-h-[3.5rem] w-full resize-none bg-transparent px-4 pt-3 pb-3 font-body text-sm text-foreground outline-none placeholder:text-muted-foreground/50 focus-visible:ring-0"
				rows={1}
				autoFocus
				aria-label="Message input"
			/>
			<ComposerActionBar
				promptCachingEnabled={promptCachingEnabled}
				onTogglePromptCaching={onTogglePromptCaching}
			/>
		</ComposerPrimitive.AttachmentDropzone>
	</ComposerPrimitive.Root>
);

const ComposerActionBar: FC<ComposerProps> = ({ promptCachingEnabled, onTogglePromptCaching }) => {
	const isCachingOn = promptCachingEnabled === true;
	const isCachingOff = promptCachingEnabled === false;
	const label =
		isCachingOn
			? "Prompt caching ON (click to disable)"
			: isCachingOff
				? "Prompt caching OFF (click to enable)"
				: "Prompt caching: inherit from server (click to enable)";

	return (
		<div className="relative mx-2 mb-2 flex items-center justify-between">
			<div className="flex items-center gap-1">
				<ComposerAddAttachment />
				{onTogglePromptCaching && (
					<Tooltip>
						<TooltipTrigger asChild>
							<button
								type="button"
								onClick={onTogglePromptCaching}
								aria-label={label}
								className={cn(
									"flex size-7 items-center justify-center rounded-md transition-colors",
									isCachingOn
										? "text-primary hover:text-primary/70"
										: "text-muted-foreground/50 hover:text-muted-foreground",
								)}
							>
								{isCachingOn ? (
									<ZapIcon className="size-3.5 fill-current" />
								) : (
									<ZapOffIcon className="size-3.5" />
								)}
							</button>
						</TooltipTrigger>
						<TooltipContent side="top" className="font-mono text-[11px]">
							{label}
						</TooltipContent>
					</Tooltip>
				)}
			</div>
			<AuiIf condition={(s) => !s.thread.isRunning}>
				<ComposerPrimitive.Send asChild>
					<TooltipIconButton
						tooltip="Send message"
						side="bottom"
						type="submit"
						variant="default"
						size="icon"
						className="size-8 rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
						aria-label="Send message"
					>
						<ArrowUpIcon className="size-4" />
					</TooltipIconButton>
				</ComposerPrimitive.Send>
			</AuiIf>
			<AuiIf condition={(s) => s.thread.isRunning}>
				<ComposerPrimitive.Cancel asChild>
					<Button
						type="button"
						variant="default"
						size="icon"
						className="size-8 rounded-full"
						aria-label="Stop generating"
					>
						<SquareIcon className="size-3 fill-current" />
					</Button>
				</ComposerPrimitive.Cancel>
			</AuiIf>
		</div>
	);
};

// ─── Avatars ──────────────────────────────────────────────────────────────────

const UserAvatar: FC = () => (
	<div className="flex flex-col items-center gap-1 pt-0.5">
		<Avatar className="size-8 ring-1 ring-zinc-600">
			<AvatarFallback className="bg-zinc-700 text-zinc-200">
				<UserIcon size={14} />
			</AvatarFallback>
		</Avatar>
		<span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground/60">
			You
		</span>
	</div>
);

const AgentAvatar: FC = () => (
	<div className="flex flex-col items-center gap-1 pt-0.5">
		<Avatar className="size-8 ring-1 ring-primary/30">
			<AvatarFallback className="bg-primary/15 text-primary">
				<SparklesIcon size={14} />
			</AvatarFallback>
		</Avatar>
		<span className="font-mono text-[9px] uppercase tracking-wider text-primary/70">
			Agent
		</span>
	</div>
);

// ─── User Message ─────────────────────────────────────────────────────────────

const UserMessage: FC = () => (
	<MessagePrimitive.Root
		className="fade-in slide-in-from-bottom-1 mx-auto flex w-full max-w-(--thread-max-width) animate-in flex-col gap-0.5 px-4 py-2 duration-150"
		data-role="user"
	>
		<UserMessageAttachments />
		<div className="flex w-full items-start gap-3">
			<UserActionBar />
			<div className="min-w-0 flex-1">
				<div className="wrap-break-word rounded-2xl rounded-tr-sm bg-zinc-800 px-4 py-3 font-body text-sm text-foreground leading-relaxed shadow-sm">
					<MessagePrimitive.Parts
						components={{ Text: EnhancedMarkdownText }}
					/>
				</div>
			</div>
			<UserAvatar />
		</div>
		<div className="pr-11">
			<BranchPicker />
		</div>
	</MessagePrimitive.Root>
);

const UserActionBar: FC = () => (
	<ActionBarPrimitive.Root
		hideWhenRunning
		autohide="not-last"
		className="flex shrink-0 flex-col items-end pt-2"
	>
		<ActionBarPrimitive.Edit asChild>
			<TooltipIconButton tooltip="Edit" className="p-2">
				<PencilIcon />
			</TooltipIconButton>
		</ActionBarPrimitive.Edit>
	</ActionBarPrimitive.Root>
);

// ─── Assistant Message ────────────────────────────────────────────────────────

const AssistantMessage: FC = () => (
	<MessagePrimitive.Root
		className="fade-in slide-in-from-bottom-1 mx-auto flex w-full max-w-(--thread-max-width) animate-in flex-col gap-0.5 px-4 py-2 duration-150"
		data-role="assistant"
	>
		<div className="flex w-full items-start gap-3">
			<AgentAvatar />
			<div className="min-w-0 flex-1">
				<div className="wrap-break-word rounded-2xl rounded-tl-sm bg-muted/60 px-4 py-3 font-body text-sm text-foreground leading-relaxed shadow-sm">
					<MessagePrimitive.Parts
						components={{
							Text: EnhancedMarkdownText,
							Reasoning: ReasoningPart,
							tools: { Fallback: ToolCallPart },
						}}
					/>
					<MessageError />
				</div>
			</div>
		</div>
		<div className="ml-11 flex">
			<BranchPicker />
			<AssistantActionBar />
		</div>
	</MessagePrimitive.Root>
);

// ─── Reasoning Part ───────────────────────────────────────────────────────────

const ReasoningPart: FC = () => {
	const { text, status } = useMessagePartText();
	const isStreaming = status.type === "running";
	const [isOpen, setIsOpen] = useState(isStreaming);

	return (
		<Card className="my-2 overflow-hidden rounded-lg border-border/50 bg-muted/20 shadow-none">
			<Collapsible open={isOpen} onOpenChange={setIsOpen}>
				<CollapsibleTrigger asChild>
					<Button
						variant="ghost"
						className="flex h-auto w-full items-center justify-start gap-2 rounded-none px-3 py-2 hover:bg-muted/30"
						aria-expanded={isOpen}
					>
						<BrainIcon size={13} className="shrink-0 text-muted-foreground" />
						<span className="flex-1 font-mono text-[11px] text-muted-foreground">
							{isStreaming ? (
								<span className="flex items-center gap-2">
									{"// Reasoning"}
									<span className="inline-flex gap-0.5">
										<span className="h-1 w-1 animate-pulse rounded-full bg-primary/60 [animation-delay:0s]" />
										<span className="h-1 w-1 animate-pulse rounded-full bg-primary/60 [animation-delay:0.2s]" />
										<span className="h-1 w-1 animate-pulse rounded-full bg-primary/60 [animation-delay:0.4s]" />
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
				</CollapsibleTrigger>
				<CollapsibleContent>
					<Separator className="opacity-30" />
					<CardContent className="px-3 pb-3 pt-2">
						<p className="whitespace-pre-wrap font-body text-[13px] leading-relaxed text-muted-foreground">
							{text}
							{isStreaming && (
								<span className="ml-0.5 inline-block h-3.5 w-0.5 animate-[pulse_1s_step-end_infinite] bg-primary" />
							)}
						</p>
					</CardContent>
				</CollapsibleContent>
			</Collapsible>
		</Card>
	);
};

// ─── Tool Call Part (routes all tool types) ───────────────────────────────────

const ToolCallPart: FC<ToolCallMessagePartProps> = ({
	toolName,
	args,
	result,
	status,
}) => {
	if (toolName === "__skill__") {
		const a = args as {
			skillId: string;
			skillName: string;
			selectionMethod?: string;
			status: "active" | "complete";
		};
		return (
			<SkillActivationBlock
				skillId={a.skillId}
				skillName={a.skillName}
				selectionMethod={a.selectionMethod}
				status={a.status}
			/>
		);
	}

	if (toolName === "__context__") {
		const a = args as {
			strategy: string;
			messagesRemoved: number;
			tokensSaved: number;
			wasApplied: boolean;
			summaryGenerated: boolean;
		};
		return (
			<ContextUpdateBlock
				strategy={a.strategy}
				messagesRemoved={a.messagesRemoved}
				tokensSaved={a.tokensSaved}
				wasApplied={a.wasApplied}
				summaryGenerated={a.summaryGenerated}
			/>
		);
	}

	if (toolName === "__citation__") {
		const a = args as { source: string; content: string; url?: string };
		return <CitationBlock source={a.source} content={a.content} url={a.url} />;
	}

	if (toolName === "__memory_recall__") {
		const a = args as {
			items: Array<{
				key: string;
				value: string;
				source: string;
				scope?: string;
				memoryType?: string;
				importance?: number;
			}>;
			count: number;
		};
		return <MemoryRecallBlock items={a.items} count={a.count} />;
	}

	if (toolName === "__memory_mutation__") {
		const a = args as {
			operation: string;
			memoryId: string;
			content: string;
			scope: string;
			memoryType: string;
		};
		return (
			<MemoryMutationBlock
				operation={a.operation}
				memoryId={a.memoryId}
				content={a.content}
				scope={a.scope}
				memoryType={a.memoryType}
			/>
		);
	}

	if (toolName === "__artifact_input__") {
		const a = args as {
			runId: string;
			artifactId: string;
			artifactType: string;
			title: string;
			content: string;
			metadata: Record<string, unknown>;
		};
		const artifactStatus =
			status.type === "running"
				? "running"
				: status.type === "incomplete"
					? "failed"
					: "complete";
		return (
			<A2uiInputBlock
				runId={a.runId ?? ""}
				artifactId={a.artifactId}
				artifactType={a.artifactType}
				title={a.title}
				content={a.content}
				metadata={a.metadata ?? {}}
				status={artifactStatus}
			/>
		);
	}

	if (toolName === "__artifact__") {
		const a = args as {
			artifactId: string;
			artifactType: string;
			title: string;
			content: string;
			language?: string;
			isInputRequest: boolean;
		};
		// Display-only: use A2uiDisplayBlock for proper rendering, fall back to
		// ArtifactBlock for legacy persisted records that lack the new fields.
		if (!a.isInputRequest) {
			return (
				<A2uiDisplayBlock
					artifactType={a.artifactType}
					title={a.title}
					content={a.content}
					language={a.language}
				/>
			);
		}
		return (
			<ArtifactBlock
				artifactId={a.artifactId}
				artifactType={a.artifactType}
				title={a.title}
				content={a.content}
				language={a.language}
				isInputRequest={a.isInputRequest}
			/>
		);
	}

	return (
		<ToolCallBlockWrapper
			toolName={toolName}
			args={args as Record<string, unknown>}
			result={result}
			status={status}
		/>
	);
};

// ─── Message Error ────────────────────────────────────────────────────────────

const MessageError: FC = () => (
	<MessagePrimitive.Error>
		<Alert variant="destructive" className="mt-2 py-2">
			<AlertDescription>
				<ErrorPrimitive.Message className="line-clamp-3 font-body text-sm" />
			</AlertDescription>
		</Alert>
	</MessagePrimitive.Error>
);

// ─── Assistant Action Bar ─────────────────────────────────────────────────────

const AssistantActionBar: FC = () => (
	<ActionBarPrimitive.Root
		hideWhenRunning
		autohide="not-last"
		autohideFloat="single-branch"
		className="col-start-3 row-start-2 -ml-1 flex gap-1 text-muted-foreground data-floating:absolute data-floating:rounded-md data-floating:border data-floating:bg-background data-floating:p-1 data-floating:shadow-sm"
	>
		<ActionBarPrimitive.Copy asChild>
			<TooltipIconButton tooltip="Copy">
				<AuiIf condition={(s) => s.message.isCopied}>
					<CheckIcon />
				</AuiIf>
				<AuiIf condition={(s) => !s.message.isCopied}>
					<CopyIcon />
				</AuiIf>
			</TooltipIconButton>
		</ActionBarPrimitive.Copy>
		<ActionBarPrimitive.Reload asChild>
			<TooltipIconButton tooltip="Regenerate">
				<RefreshCwIcon />
			</TooltipIconButton>
		</ActionBarPrimitive.Reload>
		<ActionBarMorePrimitive.Root>
			<ActionBarMorePrimitive.Trigger asChild>
				<TooltipIconButton
					tooltip="More actions"
					className="data-[state=open]:bg-accent"
				>
					<MoreHorizontalIcon />
				</TooltipIconButton>
			</ActionBarMorePrimitive.Trigger>
			<ActionBarMorePrimitive.Content
				side="bottom"
				align="start"
				className="z-50 min-w-36 overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md"
			>
				<ActionBarPrimitive.ExportMarkdown asChild>
					<ActionBarMorePrimitive.Item className="flex cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground">
						<DownloadIcon className="size-4" />
						Export as Markdown
					</ActionBarMorePrimitive.Item>
				</ActionBarPrimitive.ExportMarkdown>
			</ActionBarMorePrimitive.Content>
		</ActionBarMorePrimitive.Root>
	</ActionBarPrimitive.Root>
);

// ─── Edit Composer ────────────────────────────────────────────────────────────

const EditComposer: FC = () => (
	<MessagePrimitive.Root className="mx-auto flex w-full max-w-(--thread-max-width) flex-col px-2 py-3">
		<ComposerPrimitive.Root className="ml-auto flex w-full max-w-[85%] flex-col rounded-2xl bg-muted">
			<ComposerPrimitive.Input
				className="min-h-14 w-full resize-none bg-transparent p-4 font-body text-foreground text-sm outline-none"
				autoFocus
			/>
			<CardFooter className="mx-3 mb-3 flex items-center gap-2 self-end p-0">
				<ComposerPrimitive.Cancel asChild>
					<Button variant="ghost" size="sm">
						Cancel
					</Button>
				</ComposerPrimitive.Cancel>
				<ComposerPrimitive.Send asChild>
					<Button size="sm">Update</Button>
				</ComposerPrimitive.Send>
			</CardFooter>
		</ComposerPrimitive.Root>
	</MessagePrimitive.Root>
);

// ─── Branch Picker ────────────────────────────────────────────────────────────

const BranchPicker: FC<BranchPickerPrimitive.Root.Props> = ({
	className,
	...rest
}) => (
	<BranchPickerPrimitive.Root
		hideWhenSingleBranch
		className={cn(
			"mr-2 -ml-2 inline-flex items-center text-muted-foreground text-xs",
			className,
		)}
		{...rest}
	>
		<BranchPickerPrimitive.Previous asChild>
			<TooltipIconButton tooltip="Previous branch">
				<ChevronLeftIcon />
			</TooltipIconButton>
		</BranchPickerPrimitive.Previous>
		<span className="font-mono font-medium">
			<BranchPickerPrimitive.Number /> / <BranchPickerPrimitive.Count />
		</span>
		<BranchPickerPrimitive.Next asChild>
			<TooltipIconButton tooltip="Next branch">
				<ChevronRightIcon />
			</TooltipIconButton>
		</BranchPickerPrimitive.Next>
	</BranchPickerPrimitive.Root>
);

// Suppress unused import warning (used for future extensions)
void useMessageRuntime;
