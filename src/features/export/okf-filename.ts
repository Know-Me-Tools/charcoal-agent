/**
 * Export filenames (spec section 4.2). Deterministic: the same title and date
 * always give the same name. The result is `[a-z0-9-]` plus the extension, so
 * it holds no path separator, dot segment, control or non-ASCII character.
 */

const MAX_SLUG_CHARS = 48;
const RESERVED = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/;
const FALLBACK_SLUG = "conversation";

/** `[a-z0-9-]`, at most 48 characters, never empty, never a Windows reserved name. */
export function slugFromTitle(title: string): string {
	const slug = title
		.normalize("NFKD")
		.replace(/[̀-ͯ]/g, "")
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.slice(0, MAX_SLUG_CHARS)
		.replace(/^-+|-+$/g, "");
	if (slug === "") return FALLBACK_SLUG;
	return RESERVED.test(slug) ? `${slug}-${FALLBACK_SLUG}` : slug;
}

/** `yyyymmdd` in UTC. */
export function yyyymmdd(at: Date): string {
	return at.toISOString().slice(0, 10).replace(/-/g, "");
}

/** `knowme-<slug>-<yyyymmdd>.md` */
export function conversationFilename(title: string, at: Date): string {
	return `knowme-${slugFromTitle(title)}-${yyyymmdd(at)}.md`;
}
