import { useCallback, useEffect, useRef, useState } from "react";

export type CopyStatus = "idle" | "copied" | "failed";

export interface UseCopyToClipboardOptions {
	/**
	 * Called when the clipboard write fails, so the caller can select the
	 * block's own text for a manual copy. Optional: the failure state is
	 * visible either way.
	 */
	selectFallback?: () => void;
	/** How long the copied/failed state shows before resetting. Default 2500 ms. */
	resetDelayMs?: number;
}

export interface UseCopyToClipboardResult {
	status: CopyStatus;
	/** Copies `text`. Never rejects: every failure lands in `status: "failed"`. */
	copy: (text: string) => Promise<void>;
}

export const COPY_RESET_DELAY_MS = 2500;

/**
 * Shared clipboard-write state for every block Copy button (spec
 * `docs/specs/chat-export-okf-and-block-copy.md` section 7).
 *
 * The four hand-written copies this replaces called
 * `navigator.clipboard.writeText(...)` with no `.catch` (or awaited it
 * without a try), so a refused write — no clipboard API, an insecure
 * context, a denied permission, a document that is not focused — was an
 * unhandled rejection the visitor never saw. Here every failure path is
 * caught and surfaces as `status: "failed"`, and the optional
 * `selectFallback` runs so the block can select its own text.
 *
 * The reset timer is cleared on unmount and restarted on each call, so a
 * second click during the 2.5 s window extends it instead of leaving a
 * stale timer to reset the newer state early.
 */
export function useCopyToClipboard(options: UseCopyToClipboardOptions = {}): UseCopyToClipboardResult {
	const { selectFallback, resetDelayMs = COPY_RESET_DELAY_MS } = options;
	const [status, setStatus] = useState<CopyStatus>("idle");
	const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	const clearResetTimer = useCallback(() => {
		if (timerRef.current !== null) {
			clearTimeout(timerRef.current);
			timerRef.current = null;
		}
	}, []);

	// On unmount, cancel a pending reset so no setState fires afterwards.
	useEffect(() => clearResetTimer, [clearResetTimer]);

	const copy = useCallback(
		async (text: string): Promise<void> => {
			clearResetTimer();
			let succeeded = false;
			try {
				const clipboard = typeof navigator === "undefined" ? undefined : navigator.clipboard;
				if (clipboard && typeof clipboard.writeText === "function") {
					await clipboard.writeText(text);
					succeeded = true;
				}
			} catch {
				succeeded = false;
			}

			if (succeeded) {
				setStatus("copied");
			} else {
				setStatus("failed");
				selectFallback?.();
			}

			timerRef.current = setTimeout(() => {
				timerRef.current = null;
				setStatus("idle");
			}, resetDelayMs);
		},
		[clearResetTimer, selectFallback, resetDelayMs],
	);

	return { status, copy };
}

/**
 * Selects the whole text of an element (a block's own rendered source), the
 * manual-copy fallback when the clipboard write itself is refused.
 */
export function selectElementText(element: Element | null | undefined): void {
	if (!element) return;
	const selection = typeof window === "undefined" ? null : window.getSelection();
	if (!selection) return;
	const range = document.createRange();
	range.selectNodeContents(element);
	selection.removeAllRanges();
	selection.addRange(range);
}
