import { ALLOWED_HOSTS } from "./allowed-hosts";
import { CORPUS_URLS } from "./corpus-urls";

/**
 * Whether a citation URL may render as a clickable link (FR-16,
 * site-citation-link-allowlist). The URL comes from the model's stream, so
 * it is untrusted: a citation renders as a link only if it is an `https:`
 * URL that either exactly matches a URL string in the corpus or whose host
 * exactly matches a host on the site-owned allowlist. Everything else
 * (lookalike hosts, other schemes, userinfo, malformed input) is rejected
 * so the caller falls back to plain text.
 *
 * Matching is exact-string / exact-hostname only — never a suffix or
 * substring check — so `know-me.tools.evil.example` and
 * `evil.example/know-me.tools` both fail.
 */
export function isAllowedLink(url: string): boolean {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }

  // Only https: — rules out javascript:, data:, http: and every other scheme.
  if (parsed.protocol !== "https:") return false;

  // Userinfo (`https://user@host/...`) can make a URL display misleadingly;
  // reject it even if the host itself is allowed.
  if (parsed.username !== "" || parsed.password !== "") return false;

  // Exact corpus URL string match (compared against the raw input, not the
  // URL object's normalized form — the corpus holds the strings as written).
  if (CORPUS_URLS.has(url)) return true;

  // Exact host match against the site-owned allowlist.
  return ALLOWED_HOSTS.has(parsed.hostname);
}
