// In-memory record of blocks that failed to render, keyed by message id plus
// block index. Nothing is persisted or sent anywhere. The console line has the
// same fixed field list as the original render-failure log and as
// stream-failure-log.ts: kind, language and the length of the redacted
// message, never the message, the source or an id.

import { MAX_SOURCE_CHARS } from "./fix-turn";
import { redactError } from "./redact";

export type RenderFailureKind = "render-exception" | "mermaid-parse";

export interface RenderFailureRecord {
	kind: RenderFailureKind;
	lang: string;
	/** Source cut at MAX_SOURCE_CHARS. */
	sourceTruncated: string;
	/** True when the cut removed text. */
	wasTruncated: boolean;
	redactedError: string;
	at: number;
	/** Set once the visitor has used "fix this" for the block. */
	fixUsed: boolean;
}

type Listener = () => void;

let records: ReadonlyMap<string, RenderFailureRecord> = new Map();
const listeners = new Set<Listener>();

function publish(next: ReadonlyMap<string, RenderFailureRecord>): void {
	records = next;
	for (const listener of listeners) listener();
}

export function blockKey(messageId: string, blockIndex: number): string {
	return `${messageId}#${blockIndex}`;
}

export function subscribeRenderFailures(listener: Listener): () => void {
	listeners.add(listener);
	return () => {
		listeners.delete(listener);
	};
}

export function getRenderFailure(key: string): RenderFailureRecord | undefined {
	return records.get(key);
}

export function recordRenderFailure(input: {
	key: string;
	kind: RenderFailureKind;
	lang: string;
	source: string;
	error: unknown;
	now?: number;
}): void {
	const wasTruncated = input.source.length > MAX_SOURCE_CHARS;
	const sourceTruncated = wasTruncated ? input.source.slice(0, MAX_SOURCE_CHARS) : input.source;
	const redactedError = redactError(input.error);
	const previous = records.get(input.key);
	if (
		previous &&
		previous.kind === input.kind &&
		previous.lang === input.lang &&
		previous.sourceTruncated === sourceTruncated &&
		previous.redactedError === redactedError
	) {
		return;
	}
	const next = new Map(records);
	next.set(input.key, {
		kind: input.kind,
		lang: input.lang,
		sourceTruncated,
		wasTruncated,
		redactedError,
		at: input.now ?? Date.now(),
		// A changed source is a different block that reuses the key.
		fixUsed: previous?.sourceTruncated === sourceTruncated ? previous.fixUsed : false,
	});
	publish(next);
	console.warn("[render-failure]", {
		kind: input.kind,
		lang: input.lang,
		messageLength: redactedError.length,
	});
}

/** Marks the block's one fix offer as spent. No-op for an unknown key. */
export function markFixUsed(key: string): void {
	const record = records.get(key);
	if (!record || record.fixUsed) return;
	const next = new Map(records);
	next.set(key, { ...record, fixUsed: true });
	publish(next);
}

/** Test helper. */
export function resetRenderFailures(): void {
	publish(new Map());
}
