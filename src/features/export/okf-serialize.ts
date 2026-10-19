/**
 * The conversation serializer: a stored thread and its messages in, one OKF
 * v0.2 concept document out (spec section 5.1). Pure: no DOM, no fetch, no
 * storage, and no clock or randomness of its own; the export time comes in as
 * `exportedAt`.
 */
import type { CitationContentBlock, ContentBlock } from "@/types/chat-content";
import type { RichMessage } from "@/types/chat-content";
import { normalizeHttpsUrl } from "@/lib/link-policy/cited-web-url";
import { citationDisplayName } from "@/features/chat/citation-text";
import { artifactDroppedWhileVisible, artifactMarkdown, BLOCK_DISPOSITION, imageMarkdown, rewriteMarkers } from "./okf-blocks";
import { conversationFilename } from "./okf-filename";
import { neutralizeReplyText } from "./okf-inert";
import { oneLine, writeFrontmatter, type OkfSource } from "./okf-frontmatter";
import { buildScrub, type Scrub } from "./okf-scrub";
import { OKF_EXPORT_FORMAT_VERSION, OKF_STRINGS, omissionLine, type OmittedKinds } from "./okf-strings";

export type ExportProducer = "knowme-site" | "knowme-app";

/** The only thread fields the serializer reads for content. The ids are read only so they can be scrubbed. */
export interface ExportThreadInput {
	title: string;
	id?: string;
	sessionId?: string;
	agentId?: string | null;
}

export interface ExportInput {
	thread: ExportThreadInput;
	messages: readonly RichMessage[];
	exportedAt: Date;
	producer: ExportProducer;
}

export interface OkfExport {
	filename: string;
	markdown: string;
	/** Scrubbed title, as written in the document. Used by the bundle index. */
	title: string;
	/** Scrubbed one-line description, as written in the document. */
	description: string;
	/** UTC date (yyyy-mm-dd) of the first exported message, or null when no message has a valid time. */
	startedOn: string | null;
}

const DESCRIPTION_MAX_CHARS = 160;
const TITLE_MAX_CHARS = 200;

/** ISO 8601 with an explicit offset, seconds precision, in UTC. Null for an invalid date. */
function isoOffset(value: Date | string): string | null {
	const date = value instanceof Date ? value : new Date(value);
	return Number.isNaN(date.getTime()) ? null : `${date.toISOString().slice(0, 19)}+00:00`;
}

function clock(value: Date | string): string | null {
	const iso = isoOffset(value);
	return iso === null ? null : iso.slice(0, 16).replace("T", " ");
}

function messageTextOf(message: RichMessage): string {
	return message.content
		.filter((b): b is Extract<ContentBlock, { type: "text" }> => b.type === "text")
		.map((b) => b.text)
		.join("");
}

/** First sentence of the first question, at most 160 characters. No model call. */
function describe(messages: readonly RichMessage[], scrub: Scrub): string {
	const first = messages.find((m) => m.role === "user");
	// Scrub before truncating, so an id cut in half by the length limit cannot survive as a fragment.
	const text = first ? scrub(oneLine(messageTextOf(first))) : "";
	if (text === "") return OKF_STRINGS.fallbackDescription;
	const sentence = /^.*?[.?!](?=\s|$)/.exec(text)?.[0] ?? text;
	return sentence.length <= DESCRIPTION_MAX_CHARS ? sentence : `${sentence.slice(0, DESCRIPTION_MAX_CHARS - 1).trimEnd()}…`;
}

/** Every id the stored data carries, so none can reappear in text. */
function internalIds(input: ExportInput): string[] {
	const ids: Array<string | undefined | null> = [input.thread.id, input.thread.sessionId, input.thread.agentId];
	for (const message of input.messages) {
		ids.push(message.id);
		for (const block of message.content) {
			const b = block as unknown as Record<string, unknown>;
			for (const key of ["toolCallId", "artifactId", "runId", "skillId", "memoryId"]) {
				if (typeof b[key] === "string") ids.push(b[key] as string);
			}
		}
	}
	return ids.filter((id): id is string => typeof id === "string");
}

/** One source of the thread, with the id its footnote and `sources` entry share. */
interface SourceEntry extends OkfSource {
	footnote: string;
	defined: boolean;
}

class SourceRegistry {
	private readonly byKey = new Map<string, SourceEntry>();
	private web = 0;
	private kb = 0;

	/** The entry for a citation, minted on first sight. Ids run W1.. and K1.. across the whole thread. */
	resolve(block: CitationContentBlock): SourceEntry {
		const isWeb = block.origin === "web";
		const url = isWeb && typeof block.url === "string" ? normalizeHttpsUrl(block.url) : null;
		const name = citationDisplayName(block.source ?? "");
		const title = isWeb ? oneLine(block.source ?? "") || block.host || "Web source" : name;
		const key = isWeb ? `web|${url ?? `${block.host ?? ""}|${title}`}` : `kb|${name}`;
		const known = this.byKey.get(key);
		if (known) return known;
		const id = isWeb ? `W${++this.web}` : `K${++this.kb}`;
		const resource = isWeb
			? (url ?? `${OKF_STRINGS.webSourceFallbackPrefix}${block.host ?? title}`)
			: `${OKF_STRINGS.kbSourcePrefix}${name}`;
		const entry: SourceEntry = {
			id,
			resource,
			title,
			footnote: isWeb && url ? `${title}, ${url}` : title,
			defined: false,
		};
		this.byKey.set(key, entry);
		return entry;
	}

	list(): OkfSource[] {
		return [...this.byKey.values()].map(({ id, resource, title }) => ({ id, resource, title }));
	}
}

/** ", 2026-10-14 04:55 to 05:12 UTC" from the first and last message stamps (`yyyy-mm-dd hh:mm`); empty when none. */
function describeRange(stamps: readonly string[]): string {
	if (stamps.length === 0) return "";
	const first = stamps[0];
	const last = stamps[stamps.length - 1];
	if (first === last) return `, ${first} UTC`;
	const sameDay = first.slice(0, 10) === last.slice(0, 10);
	return `, ${first} to ${sameDay ? last.slice(11) : last} UTC`;
}

/** The body of one message, or null when nothing exportable is left. */
function renderMessage(message: RichMessage, registry: SourceRegistry, omitted: OmittedKinds): string | null {
	const isAssistant = message.role === "assistant";
	const web = new Map<number, string>();
	const kb = new Map<number, string>();
	const cited: SourceEntry[] = [];
	let hasWeb = false;
	let stopped = false;

	if (isAssistant) {
		for (const block of message.content) {
			if (block.type !== "citation") continue;
			const entry = registry.resolve(block);
			if (!cited.includes(entry)) cited.push(entry);
			if (block.origin === "web") hasWeb = true;
			if (typeof block.index === "number") (block.origin === "web" ? web : kb).set(block.index, entry.id);
		}
	}

	const pieces: string[] = [];
	let run = "";
	const flush = (): void => {
		if (run.trim() !== "") pieces.push(isAssistant ? rewriteMarkers(neutralizeReplyText(run.trim()), web, kb) : run.trim());
		run = "";
	};
	for (const block of message.content) {
		// The allowlist: a type with no "serialized" entry (omitted or unknown) is dropped here.
		if (BLOCK_DISPOSITION[block.type] !== "serialized") continue;
		if (block.type === "text") {
			run += block.text;
			continue;
		}
		if (block.type === "artifact" && isAssistant) {
			flush();
			const md = artifactMarkdown(block);
			if (md !== null) pieces.push(md);
			else if (artifactDroppedWhileVisible(block)) omitted.cards = true;
		} else if (block.type === "image") {
			flush();
			const md = imageMarkdown(block);
			if (md !== null) pieces.push(md);
			else omitted.images = true;
		} else if (block.type === "error" && isAssistant) {
			stopped = true;
		}
	}
	flush();

	if (pieces.length === 0 && !stopped) return null;
	if (isAssistant) {
		if (hasWeb) pieces.push(OKF_STRINGS.webSearchOn);
		for (const entry of cited) {
			if (entry.defined) continue;
			entry.defined = true;
			pieces.push(`[^${entry.id}]: ${oneLine(entry.footnote)}`);
		}
		if (stopped) pieces.push(OKF_STRINGS.stopped);
		else if (message.status === "in_progress" || message.status === "failed") pieces.push(OKF_STRINGS.incomplete);
	}
	return pieces.join("\n\n");
}

function heading(role: RichMessage["role"]): string {
	return role === "user" ? OKF_STRINGS.userHeading : OKF_STRINGS.assistantHeading;
}

/** One conversation as an OKF concept document, or null when no message has exportable content. */
export function serializeConversation(input: ExportInput): OkfExport | null {
	const scrub: Scrub = buildScrub(internalIds(input));
	const registry = new SourceRegistry();
	const omitted: OmittedKinds = { cards: false, images: false };

	const sections: Array<{ message: RichMessage; body: string }> = [];
	for (const message of input.messages) {
		if (message.role === "system") continue;
		const body = renderMessage(message, registry, omitted);
		if (body !== null) sections.push({ message, body });
	}
	if (sections.length === 0) return null;

	const title = scrub(oneLine(input.thread.title)).slice(0, TITLE_MAX_CHARS) || OKF_STRINGS.fallbackTitle;
	const stamps = sections.map((s) => clock(s.message.createdAt)).filter((s): s is string => s !== null);
	const range = describeRange(stamps);
	const exportedAt = isoOffset(input.exportedAt) ?? "1970-01-01T00:00:00+00:00";

	const parts = sections.map(({ message, body }) => {
		const at = isoOffset(message.createdAt);
		return [`## ${heading(message.role)}`, ...(at ? [`_${at}_`] : []), body].join("\n\n");
	});

	const description = describe(input.messages, scrub);
	const frontmatter = writeFrontmatter({
		type: OKF_STRINGS.conceptType,
		title,
		description,
		status: "stable",
		generatedBy: `${input.producer}/${OKF_EXPORT_FORMAT_VERSION}`,
		generatedAt: exportedAt,
		tags: ["conversation", "knowme"],
		sources: registry.list(),
	});
	const document = `${frontmatter}\n${[
		`# ${title}`,
		`Conversation with the ${OKF_STRINGS.assistantHeading}${range}.\n${OKF_STRINGS.provenance}`,
		...parts,
		...(omitted.cards || omitted.images ? [omissionLine(omitted)] : []),
	].join("\n\n")}`;

	return {
		filename: conversationFilename(title, input.exportedAt),
		markdown: `${scrub(document).trimEnd()}\n`,
		title,
		description,
		startedOn: stamps.length > 0 ? stamps[0].slice(0, 10) : null,
	};
}
