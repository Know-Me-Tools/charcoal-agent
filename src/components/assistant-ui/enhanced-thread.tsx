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
} from "lucide-react";
import { type FC, useState } from "react";
import {
	ComposerAddAttachment,
	ComposerAttachments,
	UserMessageAttachments,
} from "@/components/assistant-ui/attachment";
import { EnhancedMarkdownText } from "@/components/assistant-ui/enhanced-markdown-text";
import { TooltipIconButton } from "@/components/assistant-ui/tooltip-icon-button";
import { Button } from "@/components/ui/button";
import { ToolCallBlockWrapper } from "@/features/chat/components/tool-call-block";
import { cn } from "@/lib/utils";

// ─── Root Thread ─────────────────────────────────────────────────────────────

export const EnhancedThread: FC = () => {
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
					<EnhancedComposer />
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

const EnhancedComposer: FC = () => (
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
			<ComposerActionBar />
		</ComposerPrimitive.AttachmentDropzone>
	</ComposerPrimitive.Root>
);

const ComposerActionBar: FC = () => (
	<div className="relative mx-2 mb-2 flex items-center justify-between">
		<ComposerAddAttachment />
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

// ─── User Message ─────────────────────────────────────────────────────────────

const UserMessage: FC = () => (
	<MessagePrimitive.Root
		className="fade-in slide-in-from-bottom-1 mx-auto grid w-full max-w-(--thread-max-width) animate-in auto-rows-auto grid-cols-[minmax(72px,1fr)_auto] content-start gap-y-2 px-2 py-3 duration-150 [&:where(>*)]:col-start-2"
		data-role="user"
	>
		<UserMessageAttachments />
		<div className="relative col-start-2 min-w-0">
			<div className="wrap-break-word rounded-2xl bg-muted px-4 py-3 font-body text-sm text-foreground leading-relaxed">
				<MessagePrimitive.Parts />
			</div>
			<div className="absolute top-1/2 left-0 -translate-x-full -translate-y-1/2 pr-2">
				<UserActionBar />
			</div>
		</div>
		<BranchPicker className="col-span-full col-start-1 row-start-3 -mr-1 justify-end" />
	</MessagePrimitive.Root>
);

const UserActionBar: FC = () => (
	<ActionBarPrimitive.Root
		hideWhenRunning
		autohide="not-last"
		className="flex flex-col items-end"
	>
		<ActionBarPrimitive.Edit asChild>
			<TooltipIconButton tooltip="Edit" className="p-4">
				<PencilIcon />
			</TooltipIconButton>
		</ActionBarPrimitive.Edit>
	</ActionBarPrimitive.Root>
);

// ─── Assistant Message ────────────────────────────────────────────────────────

const AssistantMessage: FC = () => (
	<MessagePrimitive.Root
		className="fade-in slide-in-from-bottom-1 relative mx-auto w-full max-w-(--thread-max-width) animate-in py-3 duration-150"
		data-role="assistant"
	>
		<div className="wrap-break-word px-2 text-foreground leading-relaxed">
			<MessagePrimitive.Parts
				components={{
					Text: EnhancedMarkdownText,
					Reasoning: ReasoningPart,
					tools: { Fallback: ToolCallPart },
				}}
			/>
			<MessageError />
		</div>

		<div className="mt-1 ml-2 flex">
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
		<div className="my-2 overflow-hidden rounded-lg border border-border/50 bg-muted/20">
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
			{isOpen && (
				<div className="border-t border-border/30 px-3 pb-3 pt-2">
					<p className="whitespace-pre-wrap font-body text-[13px] leading-relaxed text-muted-foreground">
						{text}
						{isStreaming && (
							<span className="ml-0.5 inline-block h-3.5 w-0.5 animate-[pulse_1s_step-end_infinite] bg-primary" />
						)}
					</p>
				</div>
			)}
		</div>
	);
};

// ─── Tool Call Part ───────────────────────────────────────────────────────────

const ToolCallPart: FC<ToolCallMessagePartProps> = ({
	toolName,
	args,
	result,
	status,
}) => (
	<ToolCallBlockWrapper
		toolName={toolName}
		args={args as Record<string, unknown>}
		result={result}
		status={status}
	/>
);

// ─── Message Error ────────────────────────────────────────────────────────────

const MessageError: FC = () => (
	<MessagePrimitive.Error>
		<ErrorPrimitive.Root className="mt-2 rounded-md border border-destructive bg-destructive/10 p-3 text-destructive text-sm dark:bg-destructive/5 dark:text-red-200">
			<ErrorPrimitive.Message className="line-clamp-3" />
		</ErrorPrimitive.Root>
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
			<div className="mx-3 mb-3 flex items-center gap-2 self-end">
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

// Suppress unused import warning from useMessageRuntime (used for future extensions)
void useMessageRuntime;
