/**
 * Per-block export (spec sections 6 and 7). An allowlist: every ContentBlock
 * type is mapped here either to output or to an explicit omission, and the
 * mapped type is checked at compile time (`Record<ContentBlock["type"], ...>`)
 * and at test time against the source union. A block type with no entry never
 * reaches the file; it is dropped, not dumped.
 *
 * Block text comes from `../blocks/block-text`, the same functions the Copy
 * buttons call, so copy and export cannot drift.
 */
import type { ArtifactContentBlock, ContentBlock, ImageContentBlock } from "@/types/chat-content";
import { OKF_PUBLIC_ORIGIN } from "./okf-strings";
import { defaultRenderRegistry } from "@/features/chat/render-registry/default-entries";
import { OWN_IMAGE_HOST } from "@/lib/link-policy/allowed-reply-links";
import { codeBlockText, mermaidBlockText, svgBlockText } from "../blocks/block-text";

export type BlockDisposition = "serialized" | "omitted";

/** What the exporter does with each stored block type. Adding a type to the union fails the build until it is listed. */
export const BLOCK_DISPOSITION: Readonly<Record<ContentBlock["type"], BlockDisposition>> = {
	text: "serialized",
	citation: "serialized",
	image: "serialized",
	artifact: "serialized",
	error: "serialized",
	// Excluded always (spec 6.1): what the app stores, not what the visitor sees.
	reasoning: "omitted",
	"tool-call": "omitted",
	"skill-activation": "omitted",
	"context-update": "omitted",
	"memory-recall": "omitted",
	"memory-mutation": "omitted",
	step: "omitted",
};

export const SERIALIZED_BLOCK_TYPES = Object.entries(BLOCK_DISPOSITION)
	.filter(([, d]) => d === "serialized")
	.map(([type]) => type);
export const OMITTED_BLOCK_TYPES = Object.entries(BLOCK_DISPOSITION)
	.filter(([, d]) => d === "omitted")
	.map(([type]) => type);

/** A fence longer than any backtick run inside the body, so the body cannot close it early. */
export function fence(language: string, body: string): string {
	const longest = Math.max(0, ...(body.match(/`+/g) ?? []).map((run) => run.length));
	const ticks = "`".repeat(Math.max(3, longest + 1));
	return `${ticks}${language}\n${body}\n${ticks}`;
}

const LANGUAGE = /^[a-z0-9][a-z0-9+#._-]{0,19}$/i;

/** Artifact types that are plain source the visitor sees (spec 7); form, confirm, display and the hidden run types are not. */
const SOURCE_ARTIFACT_TYPES: ReadonlySet<string> = new Set(["code", "html", "svg", "mermaid", "markdown"]);

/** An artifact as a fenced block; null for input requests and every type not on the allowlist. */
export function artifactMarkdown(block: ArtifactContentBlock): string | null {
	if (block.isInputRequest || !SOURCE_ARTIFACT_TYPES.has(block.artifactType)) return null;
	const declared = block.artifactType === "code" ? block.language : block.artifactType;
	const language = declared && LANGUAGE.test(declared) ? declared.toLowerCase() : "";
	if (typeof block.content !== "string" || block.content === "") return null;
	if (language === "svg") return fence("svg", svgBlockText(block.content));
	if (language === "mermaid") return fence("mermaid", mermaidBlockText(block.content));
	return fence(language, codeBlockText(block.content));
}

/**
 * True when the visitor could see this artifact in the chat but the file has no
 * text for it: an input request, or a type the render registry shows (form,
 * confirm, display, a2ui). Types the registry hides (provider_event and the
 * other run diagnostics) and types it does not know are not visible, so they
 * never count. Source types are not asked of the registry.
 */
export function artifactDroppedWhileVisible(block: ArtifactContentBlock): boolean {
	if (SOURCE_ARTIFACT_TYPES.has(block.artifactType)) return block.isInputRequest;
	return defaultRenderRegistry.resolve({ kind: "artifact", name: block.artifactType }).disposition !== "hide";
}

/** Own-host or same-origin images only (the reply policy); everything else is omitted. */
export function imageMarkdown(block: ImageContentBlock): string | null {
	const url = typeof block.url === "string" ? block.url.trim() : "";
	let absolute: string | null = null;
	if (url.startsWith("/") && !url.startsWith("//")) {
		absolute = `${OKF_PUBLIC_ORIGIN}${url}`;
	} else {
		try {
			const parsed = new URL(url);
			if (parsed.protocol === "https:" && parsed.hostname === OWN_IMAGE_HOST && !parsed.username && !parsed.password) {
				absolute = parsed.href;
			}
		} catch {
			absolute = null;
		}
	}
	if (absolute === null) return null;
	const alt = (block.alt ?? "").replace(/[[\]\r\n]+/g, " ").trim();
	return `![${alt}](${absolute})`;
}

/**
 * Rewrites reply citation markers to footnote references outside code. `[W2]`
 * and `[3]` become `[^W1]` / `[^K1]` through the maps; a marker with no
 * matching citation, and any `[n](link)` or `[n]:` definition, stays as written.
 */
export function rewriteMarkers(
	text: string,
	web: ReadonlyMap<number, string>,
	kb: ReadonlyMap<number, string>,
): string {
	if (web.size === 0 && kb.size === 0) return text;
	const swap = (segment: string): string =>
		segment.replace(/\[(W?)(\d{1,4})\](?![(:])/g, (whole, w: string, n: string) => {
			const id = (w === "W" ? web : kb).get(Number(n));
			return id ? `[^${id}]` : whole;
		});
	let inFence: string | null = null;
	return text
		.split("\n")
		.map((line) => {
			const marker = /^\s{0,3}(`{3,}|~{3,})/.exec(line)?.[1];
			if (inFence !== null) {
				if (marker && marker[0] === inFence[0] && marker.length >= inFence.length) inFence = null;
				return line;
			}
			if (marker) {
				inFence = marker;
				return line;
			}
			return line
				.split(/(`+[^`]*`+)/)
				.map((part, i) => (i % 2 === 1 ? part : swap(part)))
				.join("");
		})
		.join("\n");
}
