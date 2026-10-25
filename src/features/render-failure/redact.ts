// One-line, shareable form of a render error. The raw message never reaches the
// UI; this is what the registry stores, the fix turn quotes and the report copies.

export const MAX_ERROR_CHARS = 200;
const REDACTED = "[redacted]";

/** The message text of whatever a failed render threw. Total: never throws. */
export function errorText(error: unknown): string {
	if (error instanceof Error) return error.message;
	if (typeof error === "string") return error;
	if (error && typeof error === "object") {
		const { message, str } = error as { message?: unknown; str?: unknown };
		if (typeof message === "string") return message;
		if (typeof str === "string") return str;
	}
	return "Unknown error";
}

/**
 * Drops stack frames, URLs and anything token-like, collapses to one line and
 * caps the length. Order matters: URLs go before the token pattern so a long
 * path is not reported as a token.
 */
export function redactError(error: unknown): string {
	const lines = errorText(error)
		.split(/\r?\n/)
		.filter((line) => !/^\s*at\s/.test(line));
	const redacted = lines
		.join(" ")
		.replace(/\b(?:https?|wss?|ftp|file):\/\/\S+/gi, REDACTED)
		.replace(/\bwww\.\S+/gi, REDACTED)
		.replace(/\bBearer\s+\S+/gi, REDACTED)
		.replace(/[\w-]*(?:token|key|secret|password|passwd|auth|authorization)\s*[=:]\s*\S+/gi, REDACTED)
		.replace(/\beyJ[\w-]+\.[\w-]+\.[\w-]+/g, REDACTED)
		.replace(/\b[A-Za-z0-9_-]{24,}\b/g, REDACTED)
		.replace(/\s+/g, " ")
		.trim();
	const line = redacted === "" ? "Unknown error" : redacted;
	return line.length > MAX_ERROR_CHARS ? `${line.slice(0, MAX_ERROR_CHARS - 1)}…` : line;
}
