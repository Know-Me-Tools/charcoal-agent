/**
 * Last-line scrub applied to every string that reaches the file (spec P-4, 10).
 * The allowlist in `okf-blocks.ts` keeps internal fields out by never reading
 * them; this catches the case where such a value was typed or pasted into text,
 * or echoed by the model: the thread's own ids, bearer tokens, session headers
 * and internal endpoint URLs.
 */
import { OKF_STRINGS } from "./okf-strings";

const MIN_ID_LENGTH = 8;

/** A bearer token has digits and is long; the words in "Bearer authentication" are prose and stay. */
const PATTERNS: readonly RegExp[] = [
	/\bBearer\s+(?=[A-Za-z0-9._~+/=-]*\d)[A-Za-z0-9._~+/=-]{16,}/gi,
	/\bX-UAR-Session-ID\s*[:=]\s*\S+/gi,
	/\beyJ[A-Za-z0-9_-]{5,}\.[A-Za-z0-9_-]{5,}\.[A-Za-z0-9_-]{5,}/g,
	/\bhttps?:\/\/(?:localhost|127\.\d+\.\d+\.\d+|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|[\w.-]+\.(?:svc|internal|cluster\.local|local))(?::\d+)?[^\s)<>"]*/gi,
];

/** Internal endpoint paths; the leading character is kept so prose around the path stays intact. */
const INTERNAL_PATH = /(^|[^\w/])\/(?:api\/(?:chat|sessions|agents|compiler|providers|skills|uar)|healthz|readyz)\b[^\s)<>"]*/gi;

export type Scrub = (text: string) => string;

/** Builds the scrub for one export; `knownIds` are the ids found in the input. */
export function buildScrub(knownIds: Iterable<string | undefined | null>): Scrub {
	const ids = [...new Set([...knownIds].filter((id): id is string => typeof id === "string" && id.length >= MIN_ID_LENGTH))]
		.sort((a, b) => b.length - a.length);
	return (text) => {
		let out = text;
		for (const id of ids) out = out.split(id).join(OKF_STRINGS.redacted);
		for (const pattern of PATTERNS) out = out.replace(pattern, OKF_STRINGS.redacted);
		out = out.replace(INTERNAL_PATH, (_m, lead: string) => `${lead}${OKF_STRINGS.redacted}`);
		return out;
	};
}
