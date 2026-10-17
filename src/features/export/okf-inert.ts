/**
 * Makes the assistant's prose inert for the exported file (spec section 10).
 *
 * The page shows a reply through a policy: links to unreviewed destinations and
 * images from other hosts become text, raw HTML is stripped. The exported file
 * is read by other tools (a Markdown previewer, a knowledge base), so it gets
 * the same treatment instead of the model's raw text:
 *
 * - a link or image the on-screen policy would not render as a link or image
 *   becomes plain text followed by its destination in a code span (a code span
 *   is never linked or fetched);
 * - an autolink `<https://...>` to a destination the policy rejects likewise;
 * - raw HTML, including comments, has its `<` escaped.
 *
 * Fenced code and inline code are left exactly as written. Only assistant text
 * goes through this; what the visitor typed is theirs.
 */
import { isAllowedReplyImage, isAllowedReplyLink } from "@/lib/link-policy/reply-content-policy";
import { OKF_STRINGS } from "./okf-strings";

/** `[label](url)` and `![alt](url)`, optional `<...>` destination and optional title. */
const INLINE_LINK = /(!?)\[([^\]\n]*)\]\(\s*<?([^)\s>]*)>?(?:\s+(?:"[^"]*"|'[^']*'))?\s*\)/g;
/** An autolink, or a `<` that opens a tag, comment or declaration. */
const ANGLE = /<((?:https?|ftp|mailto):[^>\s]+)>|<(?=[A-Za-z/!?])/gi;
/** `[ref]: url "title"` on its own line (not a footnote `[^id]:`). */
const REF_DEFINITION = /^(\s{0,3}\[(?!\^)[^\]\n]+\]:\s*)<?(\S+?)>?(\s+(?:"[^"]*"|'[^']*'|\([^)]*\)))?\s*$/;

/** The destination as an inert code span. */
function inertUrl(url: string): string {
	return `\`${url.replace(/`/g, "%60").replace(/</g, "%3C")}\``;
}

function neutralizeSegment(segment: string): string {
	const links = segment.replace(INLINE_LINK, (whole, bang: string, label: string, url: string) => {
		const allowed = bang === "!" ? isAllowedReplyImage(url) : isAllowedReplyLink(url);
		if (allowed) return whole;
		const text = label.trim();
		return text === "" ? inertUrl(url) : `${text} (${inertUrl(url)})`;
	});
	return links.replace(ANGLE, (whole, url: string | undefined) => {
		if (url === undefined) return "&lt;";
		return isAllowedReplyLink(url) ? whole : inertUrl(url);
	});
}

/** A heading that reads exactly like one of the file's own turn headings (`## You`, `## KnowMe concierge`). */
const TURN_HEADING = new RegExp(
	`^(\\s{0,3})(#{1,2}\\s+(?:${OKF_STRINGS.userHeading}|${OKF_STRINGS.assistantHeading})\\s*)$`,
	"i",
);

function neutralizeLine(line: string): string {
	// A reply must not forge a turn in the exported structure.
	const forged = TURN_HEADING.exec(line);
	if (forged) return `${forged[1]}\\${forged[2]}`;
	const definition = REF_DEFINITION.exec(line);
	if (definition && !isAllowedReplyLink(definition[2])) return `${definition[1]}${inertUrl(definition[2])}`;
	return line
		.split(/(`+[^`]*`+)/)
		.map((part, i) => (i % 2 === 1 ? part : neutralizeSegment(part)))
		.join("");
}

/** The text with every link, image and tag outside code made inert. */
export function neutralizeReplyText(text: string): string {
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
			return neutralizeLine(line);
		})
		.join("\n");
}
