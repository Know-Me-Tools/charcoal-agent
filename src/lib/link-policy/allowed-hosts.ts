/**
 * Site-owned hosts a citation URL is allowed to link to even when it is not
 * a corpus URL string. Matched by exact hostname equality only (see
 * `isAllowedLink`) — no suffix or subdomain matching, so adding a host here
 * does not implicitly allow its subdomains.
 *
 * km-security-officer sign-off on this list is recorded in
 * `openspec/changes/site-citation-link-allowlist/` (task 1.6).
 */
export const ALLOWED_HOSTS: ReadonlySet<string> = new Set(["know-me.tools"]);
