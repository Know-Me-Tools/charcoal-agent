/**
 * Build-time extraction of every absolute URL string that appears in the
 * knowledge corpus (`content/knowledge/*.md`). `isAllowedLink` treats a
 * citation URL as safe to render as a link when it matches one of these
 * strings exactly, so this list can never drift from the corpus: it is
 * recomputed from the corpus text on every build and every dev-server
 * reload via Vite's `import.meta.glob`, not hand-maintained.
 *
 * (site-citation-link-allowlist, task 1.1)
 */

// `eager: true` + `query: "?raw"` inlines each matched file's text as a
// string at build time; `import: "default"` unwraps the raw-loader's
// `{ default: string }` module shape. The glob is intentionally empty (not
// an error) when content/knowledge has no files yet.
const knowledgeFiles = import.meta.glob("../../../content/knowledge/*.md", {
  eager: true,
  query: "?raw",
  import: "default",
}) as Record<string, string>;

// Matches an absolute http(s) URL up to the first character that cannot be
// part of one in plain prose or a markdown link: whitespace, the markdown
// link/image delimiters, quotes, and angle brackets.
const URL_PATTERN = /https?:\/\/[^\s)\]"'<>]+/g;

// Trailing sentence punctuation is almost never part of the URL itself
// (e.g. "see https://example.com/x." at the end of a sentence).
const TRAILING_PUNCTUATION = /[.,;:!?]+$/;

function extractUrls(text: string): string[] {
  const matches = text.match(URL_PATTERN) ?? [];
  return matches.map((url) => url.replace(TRAILING_PUNCTUATION, ""));
}

/** The exact set of absolute URL strings found in the knowledge corpus. */
export const CORPUS_URLS: ReadonlySet<string> = new Set(
  Object.values(knowledgeFiles).flatMap(extractUrls),
);
