import { createContext, useContext, useSyncExternalStore } from "react";
import {
	blockKey,
	getRenderFailure,
	subscribeRenderFailures,
	type RenderFailureRecord,
} from "./registry";

/**
 * What a failed block needs to know about the message it sits in. Provided by
 * the markdown renderer; absent (null) when a block renders outside a thread,
 * in which case the fix action is not offered.
 */
export interface RenderBlockContextValue {
	messageId: string;
	/** A reply is streaming: the fix action is disabled. */
	isStreaming: boolean;
	/** This message answers a fix turn: no second offer. */
	isReplyToFixTurn: boolean;
	/** Text of every fix turn already in the thread, so "once" survives a reload. */
	fixTurnsText: string;
	/** Position of the fenced block with this body among the message's fences. */
	getBlockIndex: (source: string) => number;
	/** Sends a visible user turn through the runtime's onNew path. */
	sendTurn: (text: string) => void;
}

export const RenderBlockContext = createContext<RenderBlockContextValue | null>(null);

const FENCE_BODY = /(?:^|\n)(`{3,}|~{3,})[^\n]*\n([\s\S]*?)\n\1/g;

/** Bodies of the fenced blocks in a message, in order. */
export function fenceBodies(messageText: string): string[] {
	return Array.from(messageText.matchAll(FENCE_BODY), (match) => (match[2] ?? "").trim());
}

/** Index of the fence whose body matches `source`; 0 when not found. */
export function fenceIndexIn(bodies: readonly string[], source: string): number {
	const index = bodies.indexOf(source.trim());
	return index === -1 ? 0 : index;
}

export function fenceIndexOf(messageText: string, source: string): number {
	return fenceIndexIn(fenceBodies(messageText), source);
}

/** Registry key for a block: message id plus block index, or a local key outside a thread. */
export function useBlockKey(lang: string, source: string): string {
	const context = useContext(RenderBlockContext);
	if (!context) return `unscoped#${lang}:${source.length}`;
	return blockKey(context.messageId, context.getBlockIndex(source));
}

/** The registry record for a block key, live. */
export function useRenderFailureRecord(key: string): RenderFailureRecord | undefined {
	return useSyncExternalStore(
		subscribeRenderFailures,
		() => getRenderFailure(key),
		() => undefined,
	);
}
