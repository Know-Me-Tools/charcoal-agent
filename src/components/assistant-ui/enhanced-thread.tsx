import {
	ActionBarMorePrimitive,
	ActionBarPrimitive,
	AuiIf,
	BranchPickerPrimitive,
	ComposerPrimitive,
	ErrorPrimitive,
	MessagePrimitive,
	ThreadPrimitive,
	type MessagePartStatus,
	type ToolCallMessagePartProps,
} from "@assistant-ui/react";
import {
	AlertCircleIcon,
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
	PaperclipIcon,
	PencilIcon,
	RefreshCwIcon,
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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ArtifactBlock } from "@/features/chat/components/artifact-block";
import { A2uiInputBlock, A2uiDisplayBlock } from "@/features/chat/components/a2ui-artifact-block";
import { ContextUpdateBlock } from "@/features/chat/components/context-update-block";
import { MemoryMutationBlock, MemoryRecallBlock } from "@/features/chat/components/memory-block";
import { SkillActivationBlock } from "@/features/chat/components/skill-activation-block";
import { ToolCallBlockWrapper } from "@/features/chat/components/tool-call-block";
import { CitationBlock } from "@/features/chat/components/citation-block";
import { cn } from "@/lib/utils";
import { KnowMeMark } from "@/components/brand";
import { usePersistenceStatus } from "@/hooks/use-persistence-status";

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
	const persistenceStatus = usePersistenceStatus();

	return (
		<ThreadPrimitive.Root
			className="aui-root aui-thread-root @container flex h-full flex-col bg-canvas"
			style={{ ["--thread-max-width" as string]: "48rem" }}
			data-persistence={persistenceStatus}
		>
			<ThreadPrimitive.Viewport
				turnAnchor="top"
				className="aui-thread-viewport relative flex flex-1 flex-col overflow-x-hidden overflow-y-scroll scroll-smooth px-4 pt-6"
			>
				<AuiIf condition={(s) => s.thread.isEmpty}>
					<KnowMeWelcome />
				</AuiIf>

				<ThreadPrimitive.Messages>
					{({ message }) =>
						message.composer.isEditing ? (
							<EditComposer />
						) : message.role === "user" ? (
							<UserMessage />
						) : (
							<AssistantMessage />
						)
					}
				</ThreadPrimitive.Messages>

				<ThreadPrimitive.ViewportFooter className="aui-thread-viewport-footer sticky bottom-0 mx-auto mt-auto flex w-full max-w-(--thread-max-width) flex-col gap-3 bg-canvas pt-3 pb-4 @md:pb-6">
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
					<div className="flex items-center justify-center rounded-2xl bg-surface p-4 text-fg">
						<KnowMeMark size={32} />
					</div>

					<div className="space-y-1">
						<h1 className="font-display font-semibold text-2xl tracking-tight text-fg">
							KnowMe
						</h1>
						<p className="font-mono text-xs text-ember-text">
							{"// No threads yet"}
						</p>
					</div>

					<p className="max-w-sm font-body text-sm text-fg-secondary leading-relaxed">
						Ask anything. Your agent is ready to think, research, and act on
						your behalf.
					</p>

					<p className="font-mono text-xs uppercase tracking-[0.12em] text-faint">
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
			variant="ghost"
			className="absolute -top-12 z-10 size-9 self-center rounded-full bg-raised text-fg-secondary hover:bg-hover hover:text-fg disabled:invisible"
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
		<ComposerPrimitive.AttachmentDropzone className="group relative flex w-full flex-col rounded-xl bg-composer px-1 pt-2 transition-hover focus-within:bg-raised has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ring data-[dragging=true]:bg-hover">
			<ComposerAttachments />
			<ComposerPrimitive.Input
				placeholder="Ask your agent anything…"
				className="mb-1 max-h-48 min-h-14 w-full resize-none bg-transparent px-4 py-3 font-body text-[0.9375rem] text-fg leading-relaxed caret-ember outline-none placeholder:text-faint focus-visible:outline-none"
				rows={1}
				autoFocus
				aria-label="Message input"
			/>
			<ComposerActionBar
				promptCachingEnabled={promptCachingEnabled}
				onTogglePromptCaching={onTogglePromptCaching}
			/>
			<div className="pointer-events-none absolute inset-0 hidden items-center justify-center gap-2 rounded-xl bg-hover font-ui text-sm font-semibold text-fg group-data-[dragging=true]:flex">
				<PaperclipIcon className="size-4" aria-hidden="true" />
				Drop files to attach
			</div>
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
		<div className="mx-2 mb-2 flex items-center justify-between gap-2">
			<div className="flex items-center gap-1">
				<ComposerAddAttachment />
				{onTogglePromptCaching && (
					<Tooltip>
						<TooltipTrigger
							render={
								<button
									type="button"
									onClick={onTogglePromptCaching}
									aria-label={label}
									aria-pressed={isCachingOn}
									className={cn(
										"flex size-8 items-center justify-center rounded-md transition-hover hover:bg-hover focus-cue",
										isCachingOn
											? "text-ember-text"
											: "text-fg-secondary hover:text-fg",
									)}
								/>
							}
						>
							{isCachingOn ? (
								<ZapIcon className="size-3.5 fill-current" />
							) : (
								<ZapOffIcon className="size-3.5" />
							)}
						</TooltipTrigger>
						<TooltipContent side="top" className="font-mono text-xs">
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
						className="size-8 rounded-full bg-primary text-primary-foreground hover:bg-ember-2"
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

// ─── User Message ─────────────────────────────────────────────────────────────

const UserMessage: FC = () => (
	<MessagePrimitive.Root
		className="fade-in slide-in-from-bottom-1 mx-auto flex w-full max-w-(--thread-max-width) animate-in flex-col items-end px-0 pt-6 pb-2 duration-150 first:pt-0 @md:px-4"
		data-role="user"
	>
		<UserMessageAttachments />
		<div className="flex w-full items-start justify-end gap-3">
			<UserActionBar />
			<div className="min-w-0 max-w-[min(85%,36rem)] rounded-xl rounded-se-sm bg-ember-soft px-4 py-3 font-body text-[0.9375rem] text-fg leading-relaxed wrap-break-word [&_a]:text-fg">
				<span className="sr-only">You:</span>
				<MessagePrimitive.Parts>
					{({ part }) => (part.type === "text" ? <EnhancedMarkdownText /> : null)}
				</MessagePrimitive.Parts>
			</div>
			<Avatar className="hidden size-8 shrink-0 @md:flex">
				<AvatarFallback className="bg-muted-surface text-fg-secondary">
					<UserIcon className="size-4" aria-hidden="true" />
				</AvatarFallback>
			</Avatar>
		</div>
		<div className="@md:pe-11">
			<BranchPicker />
		</div>
	</MessagePrimitive.Root>
);

const UserActionBar: FC = () => (
	<ActionBarPrimitive.Root
		hideWhenRunning
		autohide="not-last"
		className="flex shrink-0 flex-col items-end pt-1"
	>
		<ActionBarPrimitive.Edit asChild>
			<TooltipIconButton tooltip="Edit">
				<PencilIcon />
			</TooltipIconButton>
		</ActionBarPrimitive.Edit>
	</ActionBarPrimitive.Root>
);

// ─── Assistant Message ────────────────────────────────────────────────────────

const AssistantMessage: FC = () => (
	<MessagePrimitive.Root
		className="fade-in slide-in-from-bottom-1 mx-auto flex w-full max-w-(--thread-max-width) animate-in flex-col px-0 pt-2 pb-6 duration-150 @md:px-4"
		data-role="assistant"
	>
		<div className="flex w-full items-start gap-3">
			<div className="hidden size-8 shrink-0 items-center justify-center rounded-lg bg-surface text-fg @md:flex">
				<KnowMeMark size={24} />
			</div>
			<div className="min-w-0 flex-1 wrap-break-word font-body text-[0.9375rem] text-fg leading-[1.7]">
				<span className="sr-only">Agent:</span>
				<MessagePrimitive.Parts>
					{({ part }) => {
						switch (part.type) {
							case "text":
								return <EnhancedMarkdownText />;
							case "reasoning":
								return <ReasoningPart text={part.text} status={part.status} />;
							case "tool-call":
								// KnowMe rich blocks are encoded as tool calls (see ToolCallPart).
								return <ToolCallPart {...part} />;
							default:
								return null;
						}
					}}
				</MessagePrimitive.Parts>
				<MessageError />
			</div>
		</div>
		<div className="mt-1 flex items-center gap-1 @md:ms-11">
			<BranchPicker />
			<AssistantActionBar />
		</div>
	</MessagePrimitive.Root>
);

// ─── Reasoning Part ───────────────────────────────────────────────────────────

interface ReasoningPartProps {
	text: string;
	status: MessagePartStatus;
}

const ReasoningPart: FC<ReasoningPartProps> = ({ text, status }) => {
	const isStreaming = status.type === "running";
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

// ─── Tool Call Part (routes all tool types) ───────────────────────────────────

const ToolCallPart: FC<ToolCallMessagePartProps> = ({
	toolName,
	args,
	result,
	status,
	isError,
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
			isError={isError}
		/>
	);
};

// ─── Message Error ────────────────────────────────────────────────────────────

/**
 * Plain-language recovery copy shown in place of raw transport/runtime error
 * text. KnowMe brand standard §7.3/§12: the assistant surface never echoes
 * error internals (stack traces, fetch failures, provider error codes) back
 * to the user; `docs/design/chat-surfaces.md` §3.8 asks for calm, actionable
 * recovery copy instead.
 */
export const MESSAGE_ERROR_TEXT = "The reply stopped before it finished.";

export const MessageError: FC = () => (
	<MessagePrimitive.Error>
		<ErrorPrimitive.Root asChild>
			<Alert className="mt-2 rounded-lg border-0 bg-danger-soft px-3 py-2 text-danger-text">
				<AlertCircleIcon className="size-4" aria-hidden="true" />
				<AlertDescription>
					{/* Children are always supplied here, so ErrorPrimitive.Message never
					    falls back to stringifying the raw error (see its `children ?? String(error)`
					    behavior) — the runtime's raw error text never reaches the DOM. */}
					<ErrorPrimitive.Message className="line-clamp-3 font-body text-sm text-danger-text">
						{MESSAGE_ERROR_TEXT}
					</ErrorPrimitive.Message>
				</AlertDescription>
				<ActionBarPrimitive.Reload asChild>
					<Button
						variant="link"
						size="sm"
						className="col-start-2 h-auto w-fit justify-self-start p-0 text-sm font-medium text-danger-text underline-offset-2 hover:text-fg focus-cue"
					>
						Try again
					</Button>
				</ActionBarPrimitive.Reload>
			</Alert>
		</ErrorPrimitive.Root>
	</MessagePrimitive.Error>
);

// ─── Assistant Action Bar ─────────────────────────────────────────────────────

const AssistantActionBar: FC = () => (
	<ActionBarPrimitive.Root
		hideWhenRunning
		autohide="not-last"
		autohideFloat="single-branch"
		className="flex gap-1 text-fg-secondary data-floating:absolute data-floating:rounded-md data-floating:bg-raised data-floating:p-1"
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
					className="data-[state=open]:bg-hover data-[state=open]:text-fg"
				>
					<MoreHorizontalIcon />
				</TooltipIconButton>
			</ActionBarMorePrimitive.Trigger>
			<ActionBarMorePrimitive.Content
				side="bottom"
				align="start"
				className="z-50 min-w-40 overflow-hidden rounded-md bg-raised p-1 text-fg"
			>
				<ActionBarPrimitive.ExportMarkdown asChild>
					<ActionBarMorePrimitive.Item className="flex cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-1.5 font-ui text-sm text-fg outline-none data-highlighted:bg-hover hover:bg-hover focus:bg-hover [&_svg]:size-4 [&_svg]:text-fg-secondary">
						<DownloadIcon />
						Export as Markdown
					</ActionBarMorePrimitive.Item>
				</ActionBarPrimitive.ExportMarkdown>
			</ActionBarMorePrimitive.Content>
		</ActionBarMorePrimitive.Root>
	</ActionBarPrimitive.Root>
);

// ─── Edit Composer ────────────────────────────────────────────────────────────

export const EditComposer: FC = () => (
	<MessagePrimitive.Root className="mx-auto flex w-full max-w-(--thread-max-width) flex-col px-0 py-3 @md:px-4">
		<ComposerPrimitive.Root className="ms-auto flex w-full max-w-[85%] flex-col rounded-xl bg-composer focus-within:bg-raised has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ring">
			<ComposerPrimitive.Input
				className="min-h-14 w-full resize-none bg-transparent p-4 font-body text-[0.9375rem] text-fg caret-ember outline-none placeholder:text-faint"
				autoFocus
			/>
			<div className="flex items-center justify-end gap-2 px-4 pb-4">
				<ComposerPrimitive.Cancel asChild>
					<Button variant="ghost" size="sm">
						Cancel
					</Button>
				</ComposerPrimitive.Cancel>
				<ComposerPrimitive.Send asChild>
					<Button size="sm">Update</Button>
				</ComposerPrimitive.Send>
			</div>
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
			"inline-flex items-center gap-1 font-mono text-xs text-fg-secondary",
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
