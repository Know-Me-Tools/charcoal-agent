/**
 * Export entry point for the open conversation (task 4.3/4.4 of
 * `app-chat-export-okf-single`). A menu from 768 px up, a bottom sheet below,
 * with 44 px targets there. The privacy line sits inside, always visible.
 *
 * EXTENSION POINT: `buildActions` is the one list of actions. The bundle
 * change (`app-chat-export-okf-bundle`) adds its "All conversations (.zip)"
 * action here, and a sidebar-footer entry reuses `ExportMenu` or the same
 * list. Nothing for the bundle is shown until that change lands.
 */
import { useId, useState, type ReactNode } from "react";
import { CopyIcon, DownloadIcon, FileDownIcon, XIcon } from "lucide-react";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { CHAT_EXPORT_CONTENT } from "../../../content/site/chat-export";
import { useConversationExport, type ConversationExportState } from "./use-conversation-export";
import { browserSaveEnv, runSave } from "./save-flow";

const C = CHAT_EXPORT_CONTENT;

interface ExportAction {
	id: string;
	label: string;
	icon: ReactNode;
	disabled: boolean;
	onSelect: () => void;
}

/** The reason an action is unavailable, as visible text. Null when ready. */
function exportDisabledReason(state: ConversationExportState): string | null {
	if (state.kind === "streaming") return C.disabledStreaming;
	if (state.kind === "empty") return C.disabledEmpty;
	return null;
}

interface ExportMenuProps {
	threadId: string;
	/** Class for the trigger button, so the top bar keeps one button style. */
	triggerClassName?: string;
}

export function ExportMenu({ threadId, triggerClassName }: ExportMenuProps) {
	const isMobile = useIsMobile();
	const [open, setOpen] = useState(false);
	const [fallbackText, setFallbackText] = useState<string | null>(null);
	const state = useConversationExport(threadId, open);
	const reasonId = useId();
	const privacyId = useId();

	const reason = exportDisabledReason(state);
	const ready = state.kind === "ready";

	// Both handlers start their browser call synchronously, inside the tap.
	const save = () => {
		if (state.kind !== "ready") return;
		const { file, markdown, caps } = state;
		setOpen(false);
		void runSave(file, caps, browserSaveEnv()).then((outcome) => {
			if (outcome.kind === "saved") toast.success(C.savedStatus);
			else if (outcome.kind === "fallback") {
				toast.error(C.saveFailedStatus);
				setFallbackText(markdown);
			}
		});
	};

	const copy = () => {
		if (state.kind !== "ready") return;
		const { markdown } = state;
		setOpen(false);
		const write =
			typeof navigator !== "undefined" && typeof navigator.clipboard?.writeText === "function"
				? navigator.clipboard.writeText(markdown)
				: Promise.reject(new Error("no clipboard"));
		write.then(
			() => toast.success(C.copiedStatus),
			() => {
				toast.error(C.copyFailedStatus);
				setFallbackText(markdown);
			},
		);
	};

	const actions: ExportAction[] = buildActions({ ready, save, copy });

	const trigger = (
		<button
			type="button"
			className={cn("flex items-center justify-center", triggerClassName)}
			aria-label={C.menuLabel}
			title={C.menuLabel}
		>
			<FileDownIcon size={16} aria-hidden="true" />
		</button>
	);

	const notes = (
		<>
			<p id={privacyId} className="px-2 pt-1.5 pb-1 font-ui text-xs text-fg-secondary">
				{C.privacyLine}
			</p>
			{reason && (
				<p id={reasonId} className="px-2 pb-1.5 font-ui text-xs text-fg-secondary">
					{reason}
				</p>
			)}
		</>
	);

	return (
		<>
			{isMobile ? (
				<Sheet open={open} onOpenChange={setOpen}>
					<SheetTrigger render={trigger} />
					<SheetContent side="bottom" showCloseButton={false} aria-describedby={privacyId} className="gap-1 pb-4">
						<SheetHeader className="h-12 pr-2">
							<SheetTitle className="flex-1">{C.menuTitle}</SheetTitle>
							<SheetClose
								aria-label={C.closeLabel}
								render={<Button variant="ghost" size="icon" className="size-11" />}
							>
								<XIcon aria-hidden="true" />
							</SheetClose>
						</SheetHeader>
						<div className="flex flex-col px-2">
							{notes}
							{actions.map((a) => (
								<Button
									key={a.id}
									type="button"
									variant="ghost"
									disabled={a.disabled}
									onClick={a.onSelect}
									className="min-h-11 w-full justify-start gap-3 px-3 text-base font-normal"
								>
									{a.icon}
									{a.label}
								</Button>
							))}
						</div>
					</SheetContent>
				</Sheet>
			) : (
				<DropdownMenu open={open} onOpenChange={setOpen}>
					<DropdownMenuTrigger render={trigger} />
					<DropdownMenuContent aria-label={C.menuTitle}>
						{notes}
						{actions.map((a) => (
							<DropdownMenuItem key={a.id} disabled={a.disabled} onClick={a.onSelect}>
								{a.icon}
								{a.label}
							</DropdownMenuItem>
						))}
					</DropdownMenuContent>
				</DropdownMenu>
			)}
			<TextFallback text={fallbackText} onClose={() => setFallbackText(null)} />
		</>
	);
}

function buildActions({ ready, save, copy }: { ready: boolean; save: () => void; copy: () => void }): ExportAction[] {
	return [
		{ id: "save", label: C.saveFile, icon: <DownloadIcon aria-hidden="true" />, disabled: !ready, onSelect: save },
		{ id: "copy", label: C.copyMarkdown, icon: <CopyIcon aria-hidden="true" />, disabled: !ready, onSelect: copy },
	];
}

/** Last resort: the Markdown in a read-only, selectable text area. */
function TextFallback({ text, onClose }: { text: string | null; onClose: () => void }) {
	return (
		<Dialog open={text !== null} onOpenChange={(next) => !next && onClose()}>
			<DialogContent showCloseButton={false} className="sm:max-w-xl">
				<DialogTitle className="font-display text-base font-semibold">{C.fallbackTitle}</DialogTitle>
				<DialogDescription>{C.fallbackHelp}</DialogDescription>
				<Textarea
					readOnly
					value={text ?? ""}
					aria-label={C.fallbackTextLabel}
					className="h-64 field-sizing-fixed resize-none border-0 bg-muted-surface font-mono text-xs"
					onFocus={(e) => e.currentTarget.select()}
				/>
				<Button type="button" onClick={onClose} className="min-h-11 md:min-h-8">
					{C.fallbackClose}
				</Button>
			</DialogContent>
		</Dialog>
	);
}
