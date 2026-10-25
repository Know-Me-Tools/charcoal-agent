import { WrenchIcon } from "lucide-react";
import { useContext } from "react";
import { CopyButton } from "@/components/common/copy-button";
import { Button } from "@/components/ui/button";
import { BLOCK_COPY_CONTENT } from "../../../content/site/block-copy";
import { RenderBlockContext, useBlockKey, useRenderFailureRecord } from "./block-context";
import { buildErrorReport, buildFixTurnText } from "./fix-turn";
import { markFixUsed } from "./registry";

function buildId(): string | null {
	return typeof __APP_VERSION__ === "string" ? `v${__APP_VERSION__}` : null;
}

interface RenderFailureActionsProps {
	lang: string;
	source: string;
}

/**
 * The two actions under a failed block. "Ask the assistant to fix this" sends
 * one visible user turn and is offered once per block: it is hidden after use,
 * when the block is itself a reply to a fix turn, and when an earlier fix turn
 * for the same source is already in the thread. It is disabled while a reply
 * streams. "Copy error report" copies a structured plain-text report.
 */
export function RenderFailureActions({ lang, source }: RenderFailureActionsProps) {
	const context = useContext(RenderBlockContext);
	const key = useBlockKey(lang, source);
	const record = useRenderFailureRecord(key);
	if (!record) return null;

	const offerFix =
		context !== null &&
		source.trim() !== "" &&
		!record.fixUsed &&
		!context.isReplyToFixTurn &&
		!context.fixTurnsText.includes(record.sourceTruncated);

	return (
		<div className="mt-2 flex flex-wrap items-center gap-2">
			{offerFix ? (
				<Button
					type="button"
					variant="secondary"
					size="sm"
					disabled={context.isStreaming}
					className="h-8 font-ui max-md:h-11 max-md:px-3"
					onClick={() => {
						markFixUsed(key);
						context.sendTurn(buildFixTurnText({ lang, redactedError: record.redactedError, source }));
					}}
				>
					<WrenchIcon className="size-3.5" aria-hidden="true" />
					{BLOCK_COPY_CONTENT.fixWithAssistant}
				</Button>
			) : null}
			<CopyButton
				label={BLOCK_COPY_CONTENT.copyErrorReport}
				text={() =>
					buildErrorReport({
						kind: record.kind,
						lang,
						redactedError: record.redactedError,
						source,
						build: buildId(),
						at: record.at,
					})
				}
			/>
		</div>
	);
}
