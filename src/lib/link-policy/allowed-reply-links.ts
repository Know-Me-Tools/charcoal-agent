/**
 * The explicit, reviewed destinations a link inside a chat message (an agent
 * reply or the visitor's own message) may render as a clickable link
 * (site-reply-content-hardening 3.2, operator decision 3).
 *
 * Deliberately NOT derived from the knowledge corpus (plan finding P7): the
 * corpus grows with competitor and attribution URLs, and every one of them
 * would otherwise become a clickable reply link by accident. Adding an entry
 * here is a reviewed change (km-security-officer, task 3.6).
 *
 * Matching follows `isAllowedLink`: `https:` only, no userinfo, exact URL
 * string or exact hostname — never a suffix match, so a subdomain of a host
 * listed here is not allowed unless it is listed itself.
 */
export const ALLOWED_REPLY_LINK_HOSTS: ReadonlySet<string> = new Set(["know-me.tools"]);

/** Exact URL strings allowed in addition to the hosts above. */
export const ALLOWED_REPLY_LINK_URLS: ReadonlySet<string> = new Set([
  // The Boss release downloads (product-owned; already cited by the KB).
  "https://github.com/Prometheus-AGS/the-boss/releases",
]);

/**
 * The site's own host. A message image may load only from exactly this host
 * (operator decision 2: own hosts only; the CSP `img-src 'self'` does not
 * cover subdomains, so neither does this policy), or from a same-origin
 * relative path.
 */
export const OWN_IMAGE_HOST = "know-me.tools";
