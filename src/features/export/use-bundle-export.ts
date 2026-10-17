/**
 * Export state for "all conversations" (task 5.3/5.4 of `app-chat-export-okf-bundle`).
 *
 * Two steps, because a zip of many conversations cannot be built inside the tap
 * that saves it (iOS Safari drops the user gesture across an `await`): Prepare
 * reads the stored conversations from the local database and builds the zip;
 * the Save button the menu then shows starts the share or download call
 * synchronously with the finished file. Nothing here touches the network or
 * writes to storage.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { getDbInstance } from "@/lib/db/pglite";
import { isSiteBuild } from "@/hooks/use-site-config";
import { buildBundle, type BundleThreadInput } from "./okf-bundle";
import { detectCapabilities, type SaveCapabilities } from "./save-flow";

/** Uncompressed text above which the menu warns that saving may take a while. */
export const LARGE_BUNDLE_BYTES = 50 * 1024 * 1024;

export type BundleExportState =
	| { kind: "idle" }
	| { kind: "preparing"; done: number; total: number }
	| { kind: "ready"; file: File; count: number; bytes: number; large: boolean; caps: SaveCapabilities }
	| { kind: "empty" }
	| { kind: "failed" };

export interface BundleExport {
	state: BundleExportState;
	prepare: () => void;
}

/** `1.2 MB`, `340 KB`, `812 B`. */
export function formatSize(bytes: number): string {
	if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
	if (bytes >= 1024) return `${Math.round(bytes / 1024)} KB`;
	return `${bytes} B`;
}

/** `open` is true while the menu or sheet is showing; closing it discards a prepared zip. */
export function useBundleExport(open: boolean): BundleExport {
	const [state, setState] = useState<BundleExportState>({ kind: "idle" });
	const run = useRef(0);

	useEffect(() => {
		if (open) return;
		run.current += 1; // abandons a run still in flight
		setState({ kind: "idle" });
	}, [open]);

	const prepare = useCallback(() => {
		const token = ++run.current;
		const alive = () => run.current === token;
		setState({ kind: "preparing", done: 0, total: 0 });

		void (async () => {
			try {
				const db = getDbInstance();
				const threads = (await db.getThreads()).filter((t) => !t.isEphemeral);
				// Reading counts as the first half of the progress, zipping the second.
				const total = threads.length * 2 + 2;
				const inputs: BundleThreadInput[] = [];
				for (const [index, thread] of threads.entries()) {
					const messages = await db.getMessages(thread.id);
					if (!alive()) return;
					inputs.push({
						thread: { title: thread.title, id: thread.id, sessionId: thread.sessionId, agentId: thread.agentId ?? null },
						messages,
					});
					setState({ kind: "preparing", done: index + 1, total });
				}

				if (!alive()) return;
				const exportedAt = new Date();
				const bundle = buildBundle(inputs, exportedAt, isSiteBuild() ? "knowme-site" : "knowme-app");
				if (bundle === null) {
					if (alive()) setState({ kind: "empty" });
					return;
				}
				const { zipFiles } = await import("./okf-zip");
				const bytes = await zipFiles(bundle.files, {
					mtime: exportedAt,
					isCancelled: () => !alive(),
					onProgress: (done) => {
						if (alive()) setState({ kind: "preparing", done: threads.length + done, total });
					},
				});
				if (!alive()) return;
				const file = new File([bytes], bundle.zipName, { type: "application/zip" });
				setState({
					kind: "ready",
					file,
					count: bundle.count,
					bytes: file.size,
					large: bundle.bytes >= LARGE_BUNDLE_BYTES,
					caps: detectCapabilities(file),
				});
			} catch (error) {
				// An abandoned run stops quietly; anything else is a failure the menu reports.
				if (!(error instanceof Error && error.name === "ZipCancelled") && alive()) setState({ kind: "failed" });
			}
		})();
	}, []);

	// Leaving the page abandons a run in flight, same as closing the menu.
	useEffect(
		() => () => {
			run.current += 1;
		},
		[],
	);

	return { state, prepare };
}
