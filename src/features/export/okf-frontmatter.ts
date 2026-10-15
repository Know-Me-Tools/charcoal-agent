/**
 * Frontmatter writer for the OKF concept document (spec section 5.1, section 8).
 *
 * Writes only the strict subset `scripts/kb/lib/frontmatter.mjs` parses: two-space
 * indent, no comments, every string and timestamp double-quoted with only the
 * `\"` and `\\` escapes. Values are forced onto one line, so message or title
 * text can never open a new key or close the block with `---`.
 */

/** One entry of `sources:`. */
export interface OkfSource {
	id: string;
	resource: string;
	title?: string;
}

export interface OkfFrontmatter {
	type: string;
	title: string;
	description: string;
	status: string;
	generatedBy: string;
	generatedAt: string;
	tags: readonly string[];
	sources: readonly OkfSource[];
}

/** True for controls, line separators and zero-width format characters. */
function isInvisible(code: number): boolean {
	return (
		code <= 0x1f ||
		(code >= 0x7f && code <= 0x9f) ||
		code === 0x2028 ||
		code === 0x2029 ||
		(code >= 0x200b && code <= 0x200f) ||
		code === 0xfeff
	);
}

/** Those characters become a space and whitespace runs collapse, so a value is always one line. */
export function oneLine(value: string): string {
	let out = "";
	for (const char of value) out += isInvisible(char.codePointAt(0) ?? 0) ? " " : char;
	return out.replace(/\s+/g, " ").trim();
}

/** A double-quoted scalar the strict parser reads back unchanged. */
export function quote(value: string): string {
	return `"${oneLine(value).replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

/** A tag is a plain scalar only when it is a safe word; anything else is dropped. */
function safeTag(tag: string): string | null {
	return /^[a-z][a-z0-9-]*$/.test(tag) && !/^(null|yes|no|on|off|true|false)$/.test(tag) ? tag : null;
}

/** The frontmatter block, `---` to `---`, ending in a newline. */
export function writeFrontmatter(fm: OkfFrontmatter): string {
	const lines = [
		"---",
		`type: ${quote(fm.type)}`,
		`title: ${quote(fm.title)}`,
		`description: ${quote(fm.description)}`,
		`status: ${quote(fm.status)}`,
		"generated:",
		`  by: ${quote(fm.generatedBy)}`,
		`  at: ${quote(fm.generatedAt)}`,
	];
	const tags = fm.tags.map(safeTag).filter((t): t is string => t !== null);
	if (tags.length > 0) lines.push(`tags: [${tags.join(", ")}]`);
	if (fm.sources.length > 0) {
		lines.push("sources:");
		for (const source of fm.sources) {
			lines.push(`  - id: ${quote(source.id)}`, `    resource: ${quote(source.resource)}`);
			if (source.title) lines.push(`    title: ${quote(source.title)}`);
		}
	}
	lines.push("---");
	return `${lines.join("\n")}\n`;
}
