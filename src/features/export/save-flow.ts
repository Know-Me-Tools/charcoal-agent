/**
 * Save flow for the export (task 4.4 of `app-chat-export-okf-single`).
 *
 * iOS Safari drops the user gesture across an `await`, so the file is built
 * when the menu OPENS and the tap that saves calls `runSave` with the finished
 * `File`. `runSave` starts the share or download call synchronously, before
 * its first `await`.
 *
 * Route order: share sheet when `navigator.canShare({files})` accepts the file;
 * anchor download with a Blob URL otherwise; on-screen text fallback when the
 * environment has neither or a route throws. A cancelled share sheet
 * (`AbortError`) is not a failure.
 *
 * No network: nothing here calls `fetch`, XHR, a beacon or an image load. The
 * Blob URL is a local reference.
 */

export type SavePath = "share" | "download" | "fallback";

export interface SaveCapabilities {
	/** `navigator.share` exists and `navigator.canShare({ files: [file] })` is true. */
	canShareFile: boolean;
	/** Anchors support the `download` attribute and `URL.createObjectURL` exists. */
	canAnchorDownload: boolean;
}

/** Pure decision: which route to try first. */
export function chooseSavePath(caps: SaveCapabilities): SavePath {
	if (caps.canShareFile) return "share";
	if (caps.canAnchorDownload) return "download";
	return "fallback";
}

export type SaveOutcome =
	/** The file went to the share sheet or the download started. */
	| { kind: "saved"; via: "share" | "download" }
	/** The visitor dismissed the share sheet. Not an error, no message. */
	| { kind: "cancelled" }
	/** Every route failed or none exists: show the text fallback. */
	| { kind: "fallback" };

/** The browser surface `runSave` touches, injectable for tests. */
export interface SaveEnv {
	share: (file: File) => Promise<void>;
	/** Starts the download synchronously. Throws if it cannot. */
	download: (file: File) => void;
}

function isAbortError(error: unknown): boolean {
	return typeof error === "object" && error !== null && (error as { name?: unknown }).name === "AbortError";
}

/**
 * Runs the save. The first route is started synchronously (no `await` before
 * it), so it runs inside the tap's user gesture.
 */
export function runSave(file: File, caps: SaveCapabilities, env: SaveEnv): Promise<SaveOutcome> {
	const first = chooseSavePath(caps);
	if (first === "share") {
		let pending: Promise<void>;
		try {
			pending = env.share(file);
		} catch (error) {
			return Promise.resolve(isAbortError(error) ? { kind: "cancelled" } : downloadOrFallback(file, caps, env));
		}
		return pending.then(
			(): SaveOutcome => ({ kind: "saved", via: "share" }),
			(error: unknown): SaveOutcome =>
				isAbortError(error) ? { kind: "cancelled" } : downloadOrFallback(file, caps, env),
		);
	}
	return Promise.resolve(first === "download" ? downloadOrFallback(file, caps, env) : { kind: "fallback" });
}

function downloadOrFallback(file: File, caps: SaveCapabilities, env: SaveEnv): SaveOutcome {
	if (!caps.canAnchorDownload) return { kind: "fallback" };
	try {
		env.download(file);
		return { kind: "saved", via: "download" };
	} catch {
		return { kind: "fallback" };
	}
}

// ─── Browser bindings ────────────────────────────────────────────────────────

/** How long the Blob URL stays valid. Not revoked at once: a browser may read it after the click returns. */
export const BLOB_URL_REVOKE_DELAY_MS = 60_000;

/** Reads what this browser can do for `file`. Call when the menu opens. */
export function detectCapabilities(file: File): SaveCapabilities {
	const nav = typeof navigator === "undefined" ? undefined : navigator;
	let canShareFile = false;
	try {
		canShareFile =
			!!nav && typeof nav.share === "function" && typeof nav.canShare === "function" && nav.canShare({ files: [file] });
	} catch {
		canShareFile = false;
	}
	const canAnchorDownload =
		typeof document !== "undefined" &&
		typeof URL !== "undefined" &&
		typeof URL.createObjectURL === "function" &&
		"download" in document.createElement("a");
	return { canShareFile, canAnchorDownload };
}

/** The real environment: `navigator.share` and an anchor click on a Blob URL. */
export function browserSaveEnv(): SaveEnv {
	return {
		share: (file) => navigator.share({ files: [file] }),
		download: (file) => {
			const url = URL.createObjectURL(file);
			const anchor = document.createElement("a");
			anchor.href = url;
			anchor.download = file.name;
			anchor.rel = "noopener";
			anchor.style.display = "none";
			document.body.appendChild(anchor);
			try {
				anchor.click();
			} finally {
				anchor.remove();
				setTimeout(() => URL.revokeObjectURL(url), BLOB_URL_REVOKE_DELAY_MS);
			}
		},
	};
}

/** Builds the file once, when the menu opens. */
export function buildMarkdownFile(filename: string, markdown: string): File {
	return new File([markdown], filename, { type: "text/markdown;charset=utf-8" });
}
