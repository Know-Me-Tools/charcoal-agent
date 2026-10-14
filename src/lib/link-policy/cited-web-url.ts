/**
 * Web-search citation links. The server mints every web citation URL
 * (`server/src/domain/web_citations.rs`: https, no userinfo, no fragment,
 * re-serialized by the URL parser), and the visitor asked for those to open.
 * So a URL is a clickable web link when it is a plain `https:` URL AND the
 * thread's web citations contain it. Text a model wrote, a link in a card, or
 * a destination the server never minted is not a citation and stays text.
 *
 * The destination is always shown next to the link and the link always opens
 * in a new tab with `noopener noreferrer`; nothing here hides where a click
 * goes. The residual risk is a hostile page that ranks in a search result and
 * that the visitor chooses to open.
 */

/** Props every external web link carries. */
export const EXTERNAL_LINK_PROPS = { target: "_blank", rel: "noopener noreferrer" } as const;

/** A plain https URL with no userinfo; the normalized string, or null. */
export function normalizeHttpsUrl(url: string): string | null {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  if (parsed.protocol !== "https:") return null;
  if (parsed.username !== "" || parsed.password !== "") return null;
  return parsed.href;
}

/** The set of web citation URLs, each in the normalized form `isCitedWebUrl` compares. */
export function toCitedUrlSet(urls: Iterable<string | undefined>): ReadonlySet<string> {
  const out = new Set<string>();
  for (const url of urls) {
    const normalized = url === undefined ? null : normalizeHttpsUrl(url);
    if (normalized !== null) out.add(normalized);
  }
  return out;
}

/** Whether `url` is one of the thread's server-minted web citation URLs. */
export function isCitedWebUrl(url: string, cited: ReadonlySet<string>): boolean {
  if (cited.size === 0) return false;
  const normalized = normalizeHttpsUrl(url.trim());
  return normalized !== null && cited.has(normalized);
}

export type TextPiece = { kind: "text"; value: string } | { kind: "url"; value: string };

const URL_IN_TEXT = /https:\/\/[^\s<>"]+/g;
/** Punctuation that ends a sentence rather than a URL. */
const TRAILING = /[.,;:!?)\]}'"]+$/;

/**
 * Split plain text into text and `https:` URL pieces. Trailing sentence
 * punctuation stays outside the URL. Every URL piece is only a candidate; the
 * caller still decides with `isCitedWebUrl` whether it may be a link.
 */
export function splitUrls(text: string): TextPiece[] {
  const pieces: TextPiece[] = [];
  let last = 0;
  for (const match of text.matchAll(URL_IN_TEXT)) {
    const raw = match[0];
    const url = raw.replace(TRAILING, "");
    const at = match.index ?? 0;
    if (at > last) pieces.push({ kind: "text", value: text.slice(last, at) });
    pieces.push({ kind: "url", value: url });
    last = at + url.length; // trailing punctuation falls into the next text piece
  }
  if (last < text.length) pieces.push({ kind: "text", value: text.slice(last) });
  return pieces;
}
