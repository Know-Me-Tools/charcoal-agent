/**
 * Display cleanup for citation cards (site-answer-card-and-sources, task 5.2).
 *
 * Both functions run at render time, not when the event arrives, so citations
 * already persisted in PGlite with raw names and snippets display the same way
 * as new ones.
 */

/** Characters a snippet keeps before it is cut at a word boundary. */
export const SNIPPET_MAX_CHARS = 160;

const ELLIPSIS = "…";
const FALLBACK_NAME = "Source";

/**
 * The KB sync uploads `<slug>.<12-hex hash>.md`; other uploads put `-` or `_`
 * before the hash, or put it first, and a title can carry the hash as its
 * last word. Each is stripped whether or not `.md` is still there.
 */
const UPLOAD_HASH_SUFFIX = /[.\-_\s][0-9a-f]{12}$/i;
const UPLOAD_HASH_PREFIX = /^[0-9a-f]{12}[-_]/i;
const MARKDOWN_EXT = /\.md$/i;

/**
 * Brand and acronym words that sentence case would break. Keys are the
 * lower-case slug tokens, matched as a sequence (`the-boss` is two tokens).
 */
const BRAND_WORDS: ReadonlyArray<readonly [tokens: readonly string[], display: string]> = [
  [["the", "boss"], "The Boss"],
  [["universal", "agent", "runtime"], "Universal Agent Runtime"],
  [["surreal", "memory", "server"], "Surreal Memory Server"],
  [["ag", "ui"], "AG-UI"],
  [["agui"], "AG-UI"],
  [["knowme"], "KnowMe"],
  [["bossfang"], "BossFang"],
  [["uar"], "UAR"],
  [["a2ui"], "A2UI"],
  [["mcp"], "MCP"],
  [["ipfs"], "IPFS"],
  [["obsidian"], "Obsidian"],
  [["faq"], "FAQ"],
];

function matchBrand(tokens: readonly string[], at: number): readonly [display: string, length: number] | null {
  for (const [brand, display] of BRAND_WORDS) {
    if (brand.every((t, i) => tokens[at + i] === t)) return [display, brand.length];
  }
  return null;
}

/** True when `raw` looks like an uploaded file name rather than a title. */
function isFileNameLike(raw: string): boolean {
  if (/\s/.test(raw)) return false;
  return MARKDOWN_EXT.test(raw) || /[-_]/.test(raw);
}

/**
 * The last segment of a folder-style name (`Products/universal agent runtime`
 * gives `universal agent runtime`). A URL, or a name with no folder prefix,
 * is returned unchanged.
 */
function lastPathSegment(raw: string): string {
  if (raw.includes("://")) return raw;
  const segments = raw.split(/[\\/]/).filter((s) => s.trim() !== "");
  if (segments.length < 2) return raw;
  return segments[segments.length - 1].trim();
}

/**
 * A readable source name, shared by the citation cards and the About panel.
 * An uploaded file name such as `knowme-platforms-and-status.0123456789ab.md`
 * becomes "KnowMe platforms and status": a folder prefix, the `.md` and the
 * 12-hex upload hash are stripped, `-` and `_` become spaces, and the result
 * is sentence case with brand words kept. A value that already reads as a
 * title is returned as is.
 */
export function citationDisplayName(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return FALLBACK_NAME;

  const segment = lastPathSegment(trimmed);
  const stem = segment
    .replace(MARKDOWN_EXT, "")
    .replace(UPLOAD_HASH_SUFFIX, "")
    .replace(UPLOAD_HASH_PREFIX, "");
  const changed = segment !== trimmed || stem !== segment;
  if (!changed && !isFileNameLike(trimmed)) return trimmed;

  const tokens = stem.toLowerCase().split(/[-_\s]+/).filter(Boolean);
  if (tokens.length === 0) return trimmed;

  const words: string[] = [];
  for (let i = 0; i < tokens.length; ) {
    const brand = matchBrand(tokens, i);
    if (brand) {
      words.push(brand[0]);
      i += brand[1];
    } else {
      words.push(tokens[i]);
      i += 1;
    }
  }
  const sentence = words.join(" ");
  return sentence.charAt(0).toUpperCase() + sentence.slice(1);
}

/** `key: value` lines of YAML-style front matter (lower-case key, no spaces). */
const FRONT_MATTER_LINE = /^[a-z][a-z0-9_-]*:\s*\S/;
const FENCE_LINE = /^\s*(```|~~~)/;
const RULE_LINE = /^\s*(-{3,}|\*{3,}|_{3,})\s*$/;

/** Drops a leading `---` front-matter block, then rule, fence and key lines. */
function dropNonProseLines(lines: readonly string[]): string[] {
  let start = 0;
  if (lines.length > 0 && /^\s*---\s*$/.test(lines[0])) {
    const end = lines.findIndex((l, i) => i > 0 && /^\s*---\s*$/.test(l));
    if (end > 0) start = end + 1;
  }
  return lines
    .slice(start)
    .filter((l) => !FENCE_LINE.test(l) && !RULE_LINE.test(l) && !FRONT_MATTER_LINE.test(l));
}

const HEADING_LINE = /^\s*#{1,6}\s+/;

function stripLineMarkers(line: string): string {
  return line
    .replace(HEADING_LINE, "")
    .replace(/^\s*>\s?/, "")
    .replace(/^\s*(?:[-*+]|\d+[.)])\s+/, "");
}

function stripInlineMarkdown(text: string): string {
  return text
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]+)\]\[[^\]]*\]/g, "$1")
    .replace(/`([^`]*)`/g, "$1")
    .replace(/(\*\*|__)(?=\S)(.+?)(?<=\S)\1/g, "$2")
    .replace(/~~(?=\S)(.+?)(?<=\S)~~/g, "$1")
    .replace(/(?<![\w*])\*(?=\S)(.+?)(?<=\S)\*(?![\w*])/g, "$1")
    .replace(/(?<![\w_])_(?=\S)(.+?)(?<=\S)_(?![\w_])/g, "$1");
}

/** Cuts at the last word boundary within `max` characters and adds "…". */
function trimAtWord(text: string, max: number): string {
  if (text.length <= max) return text;
  let cut = text.slice(0, max);
  if (!/\s/.test(text.charAt(max))) {
    const lastSpace = cut.lastIndexOf(" ");
    if (lastSpace > 0) cut = cut.slice(0, lastSpace);
  }
  return `${cut.replace(/[\s,;:.\-–—]+$/, "")}${ELLIPSIS}`;
}

/** Lower-case words of `text`, for comparing a heading with the line after it. */
function wordsOf(text: string): string[] {
  return text.toLowerCase().split(/[^\p{L}\p{N}]+/u).filter(Boolean);
}

/** True when `line` begins with every word of `heading`, in order. */
function repeatsHeading(heading: string, line: string): boolean {
  const head = wordsOf(heading);
  const start = wordsOf(line).slice(0, head.length);
  return head.length > 0 && head.every((w, i) => w === start[i]);
}

/** A heading kept in running text ends as a sentence, so it can't run into the body. */
function asSentence(heading: string): string {
  return /[.!?:;…]$/.test(heading) ? heading : `${heading}.`;
}

/**
 * Joins prose lines into one line of plain text. A markdown heading becomes
 * its own sentence ("Platforms. Desktop: …"), or is dropped when the next line
 * only repeats it ("# The Boss" then "The Boss is …").
 */
function joinProseLines(lines: readonly string[]): string {
  const parts: string[] = [];
  let heading: string | null = null;
  for (const line of lines) {
    const text = stripInlineMarkdown(stripLineMarkers(line)).replace(/\s+/g, " ").trim();
    if (!text) continue;
    if (heading !== null && !repeatsHeading(heading, text)) parts.push(asSentence(heading));
    heading = null;
    if (HEADING_LINE.test(line)) heading = text;
    else parts.push(text);
  }
  if (heading !== null) parts.push(heading);
  return parts.join(" ");
}

/**
 * Plain text for a citation excerpt: markdown syntax removed (headings,
 * emphasis, list markers, code fences, links reduced to their label), front
 * matter dropped, whitespace collapsed, and the result cut at a word boundary.
 */
export function cleanCitationSnippet(raw: string, max: number = SNIPPET_MAX_CHARS): string {
  const text = joinProseLines(dropNonProseLines(raw.split(/\r?\n/)));
  return trimAtWord(text, max);
}
