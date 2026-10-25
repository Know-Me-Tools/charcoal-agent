// The visible user turn that asks the assistant to repair a block that failed
// to render, and the plain-text report an operator can paste elsewhere. The
// broken source is model output: it is placed in a fenced block as data, after
// the fixed wording, and is never interpreted here. All wording lives in
// content/site/block-copy.ts.

import { BLOCK_COPY_CONTENT } from "../../../content/site/block-copy";

/** Source cap, in characters, for the fix turn, the report and the registry. */
export const MAX_SOURCE_CHARS = 4096;

const content = BLOCK_COPY_CONTENT;

export interface RenderFailureView {
	lang: string;
	kind: string;
	redactedError: string;
	source: string;
}

function kindNoun(lang: string): string {
	return lang === "mermaid" || lang === "svg" ? content.fixKindDiagram : content.fixKindBlock;
}

/** The first line of a fix turn for this language; also the recogniser prefix. */
export function fixTurnLead(lang: string): string {
	return content.fixTurnLead.replace("{kind}", kindNoun(lang));
}

/** True when a user message was produced by the fix action. */
export function isFixTurnText(text: string): boolean {
	const trimmed = text.trimStart();
	return [content.fixKindDiagram, content.fixKindBlock].some((kind) =>
		trimmed.startsWith(content.fixTurnLead.replace("{kind}", kind)),
	);
}

/** Cuts source at the cap; the marker is added by the caller. */
export function truncateSource(source: string): { text: string; wasTruncated: boolean } {
	if (source.length <= MAX_SOURCE_CHARS) return { text: source, wasTruncated: false };
	return { text: source.slice(0, MAX_SOURCE_CHARS), wasTruncated: true };
}

/** A fence one backtick longer than any run in the source, so the source cannot close it. */
function fenceFor(source: string): string {
	const longest = Math.max(0, ...(source.match(/`+/g) ?? []).map((run) => run.length));
	return "`".repeat(Math.max(3, longest + 1));
}

function fencedSource(source: string, language: string): string {
	const { text, wasTruncated } = truncateSource(source);
	const fence = fenceFor(text);
	const body = wasTruncated ? `${text}\n${content.sourceTruncated}` : text;
	return `${fence}${language}\n${body}\n${fence}`;
}

/**
 * The fix-turn message. The fence carries the language "text" on purpose: a
 * user message that rendered the broken diagram again would fail again.
 */
export function buildFixTurnText(view: Pick<RenderFailureView, "lang" | "redactedError" | "source">): string {
	return [
		`${fixTurnLead(view.lang)} ${content.errorLabel} ${view.redactedError}`,
		content.fixTurnRequest,
		"",
		fencedSource(view.source, "text"),
	].join("\n");
}

/** Structured plain-text report for the "Copy error report" action. */
export function buildErrorReport(view: RenderFailureView & { build: string | null; at: number }): string {
	const lines = [
		content.reportTitle,
		`${content.reportKind}: ${view.kind}`,
		`${content.reportLanguage}: ${view.lang}`,
		`${content.errorLabel} ${view.redactedError}`,
	];
	if (view.build) lines.push(`${content.reportBuild}: ${view.build}`);
	lines.push(
		`${content.reportTime}: ${new Date(view.at).toISOString()}`,
		`${content.reportSource}:`,
		fencedSource(view.source, ""),
	);
	return lines.join("\n");
}
