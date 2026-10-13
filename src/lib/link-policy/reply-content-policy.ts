import {
  ALLOWED_REPLY_LINK_HOSTS,
  ALLOWED_REPLY_LINK_URLS,
  OWN_IMAGE_HOST,
} from "./allowed-reply-links";

// An origin no real page has, used only to resolve a relative URL and see
// whether it stays on the page's own origin.
const SENTINEL_ORIGIN = "https://same-origin.invalid";

/**
 * True for a URL with no scheme and no host of its own (`/path`, `#anchor`,
 * `path`), which the browser resolves against the page itself. Resolving
 * against a sentinel origin catches the forms that look relative but are
 * not: `//host/x` and `/\host/x` (browsers read the backslash as a slash).
 */
export function isSameOriginRelative(url: string): boolean {
  if (url.trim() === "") return false;
  try {
    new URL(url);
    return false; // absolute: it has a scheme of its own
  } catch {
    // relative; resolved below
  }
  try {
    return new URL(url, `${SENTINEL_ORIGIN}/`).origin === SENTINEL_ORIGIN;
  } catch {
    return false;
  }
}

/**
 * A relative link counts only when it is a root path or an anchor. A bare
 * word such as `evil.example` resolves inside the site but reads like a
 * destination in the visible text, so it is not a link.
 */
function isRelativeReplyLink(url: string): boolean {
  return (url.startsWith("/") || url.startsWith("#")) && isSameOriginRelative(url);
}

/** An `https:` URL without userinfo, or null. */
function parseHttps(url: string): URL | null {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  if (parsed.protocol !== "https:") return null;
  if (parsed.username !== "" || parsed.password !== "") return null;
  return parsed;
}

/**
 * Whether a link in a chat message may render as a clickable link. Same
 * semantics as the citation policy (`isAllowedLink`), with the allowed set
 * taken from the explicit reviewed list, plus same-page relative links
 * (footnotes). Everything else, including `mailto:`, renders as text.
 */
export function isAllowedReplyLink(url: string): boolean {
  if (isRelativeReplyLink(url)) return true;
  const parsed = parseHttps(url);
  if (!parsed) return false;
  return ALLOWED_REPLY_LINK_URLS.has(url) || ALLOWED_REPLY_LINK_HOSTS.has(parsed.hostname);
}

/** Whether an image in a chat message may load: exactly the own host (the CSP `img-src 'self'` covers no subdomain), or same-origin. */
export function isAllowedReplyImage(src: string): boolean {
  if (isSameOriginRelative(src)) return true;
  const parsed = parseHttps(src);
  if (!parsed) return false;
  return parsed.hostname === OWN_IMAGE_HOST;
}
