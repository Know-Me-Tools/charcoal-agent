/**
 * The all-conversations bundle (spec section 5.2): `index.md`, `log.md` and one
 * concept document per conversation under `conversations/`. Pure: plain data in,
 * file list out. Zipping is `okf-zip.ts`, loaded on demand.
 *
 * Filenames are `<yyyy-mm-dd>-<slug>[-<n>].md` over `[a-z0-9-]`, so they hold no
 * path separator, dot segment or reserved name, and carry no id. A repeat of a
 * name gets `-2`, `-3`, ... in the order conversations are listed.
 */
import type { RichMessage } from "@/types/chat-content";
import { slugFromTitle, yyyymmdd } from "./okf-filename";
import { serializeConversation, type ExportProducer, type ExportThreadInput } from "./okf-serialize";
import { bundleCreationLine, OKF_STRINGS } from "./okf-strings";

export interface BundleThreadInput {
	thread: ExportThreadInput;
	messages: readonly RichMessage[];
}

export interface BundleFile {
	/** Path inside the zip, no leading slash. */
	path: string;
	content: string;
}

export interface Bundle {
	zipName: string;
	files: readonly BundleFile[];
	/** Conversations written. */
	count: number;
	/** Conversations left out because no message had exportable content. */
	skipped: number;
	/** Bytes of all file contents, UTF-8. */
	bytes: number;
}

const OKF_VERSION = "0.2";

interface Entry {
	path: string;
	title: string;
	description: string;
	date: string;
}

/**
 * Text that came from a conversation, made inert in a Markdown line: every
 * Markdown and HTML metacharacter is backslash-escaped, so a title or first
 * question cannot add a link, an image, a tag or emphasis to `index.md`.
 */
function inertText(text: string): string {
	return text.replace(/[\\`*_{}[\]()<>#+!|&~]/g, "\\$&");
}

function indexMarkdown(entries: readonly Entry[]): string {
	const months = new Map<string, Entry[]>();
	for (const entry of entries) {
		const month = /^\d{4}-\d{2}-\d{2}$/.test(entry.date) ? entry.date.slice(0, 7) : OKF_STRINGS.bundleUndated;
		months.set(month, [...(months.get(month) ?? []), entry]);
	}
	const sections = [...months].map(([month, list]) =>
		[`## ${month}`, ...list.map((e) => `* [${inertText(e.title)}](/${e.path}) - ${inertText(e.description)}`)].join("\n"),
	);
	return `---\nokf_version: "${OKF_VERSION}"\n---\n\n# ${OKF_STRINGS.bundleIndexTitle}\n\n${sections.join("\n\n")}\n`;
}

function logMarkdown(exportedAt: Date, count: number): string {
	const day = exportedAt.toISOString().slice(0, 10);
	return `# ${OKF_STRINGS.bundleLogTitle}\n\n## ${day}\n\n${bundleCreationLine(count)}\n`;
}

/** Newest conversation first; equal dates keep the order given (the caller lists by recency). */
function byNewest(a: Entry, b: Entry): number {
	return a.date < b.date ? 1 : a.date > b.date ? -1 : 0;
}

/** The bundle, or null when no conversation has anything to export. */
export function buildBundle(
	threads: readonly BundleThreadInput[],
	exportedAt: Date,
	producer: ExportProducer,
): Bundle | null {
	const used = new Set<string>();
	const entries: Entry[] = [];
	const files: BundleFile[] = [];
	let skipped = 0;

	for (const { thread, messages } of threads) {
		const out = serializeConversation({ thread, messages, exportedAt, producer });
		if (out === null) {
			skipped += 1;
			continue;
		}
		const date = out.startedOn ?? exportedAt.toISOString().slice(0, 10);
		const base = `conversations/${date}-${slugFromTitle(out.title)}`;
		let path = `${base}.md`;
		for (let n = 2; used.has(path); n += 1) path = `${base}-${n}.md`;
		used.add(path);
		files.push({ path, content: out.markdown });
		entries.push({ path, title: out.title, description: out.description, date });
	}
	if (entries.length === 0) return null;

	const ordered = [...entries].sort(byNewest);
	const all: BundleFile[] = [
		{ path: "index.md", content: indexMarkdown(ordered) },
		{ path: "log.md", content: logMarkdown(exportedAt, entries.length) },
		...files,
	];
	const encoder = new TextEncoder();
	return {
		zipName: `knowme-conversations-${yyyymmdd(exportedAt)}.zip`,
		files: all,
		count: entries.length,
		skipped,
		bytes: all.reduce((sum, f) => sum + encoder.encode(f.content).length, 0),
	};
}
