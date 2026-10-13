/**
 * Readable name for a knowledge-base citation source.
 *
 * TODO(site-answer-card-and-sources, task 5.2): the citation work exports the
 * shared display-name derivation; once it lands on main, replace this local
 * helper with that export so the Sources panel and the citation cards name a
 * source the same way. Rule (plan 5.2): strip the 12-hex upload hash and
 * `.md`, then de-slug.
 */
const UPLOADED_MD = /\.md$/i;
const UPLOAD_HASH = /^[0-9a-f]{12}[-_]|[-_][0-9a-f]{12}$/i;

export function sourceDisplayName(source: string): string {
  if (!UPLOADED_MD.test(source)) return source;
  const words = source
    .replace(UPLOADED_MD, "")
    .replace(UPLOAD_HASH, "")
    .split(/[-_\s]+/)
    .filter(Boolean)
    .join(" ");
  if (!words || /^[0-9a-f]{12}$/i.test(words)) return source;
  return words.charAt(0).toUpperCase() + words.slice(1);
}
