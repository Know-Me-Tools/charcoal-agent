/**
 * Public-site build configuration.
 *
 * `VITE_SITE_AGENT_ID` is a build-time env var. When set, this build is the
 * public marketing site: every chat request is pinned to that agent
 * regardless of thread state or any agent picker, and the UAR admin surfaces
 * (agent picker, /agents, /settings pages, skills sync push) are hidden —
 * the site's nginx proxy only allows the routes the pinned chat flow needs,
 * so those admin calls would 403 anyway. Read via a function (not a
 * module-level constant) so it re-evaluates `import.meta.env` on every call,
 * which keeps it testable with `vi.stubEnv` and matches Vite's per-build env
 * inlining without caching a stale value across test cases.
 */

/** The pinned site agent id, or `undefined` when unset/blank (default app behaviour). */
export function getSiteAgentId(): string | undefined {
  const raw = (import.meta.env.VITE_SITE_AGENT_ID as string | undefined)?.trim();
  return raw || undefined;
}

/** True when this build is pinned to a single site agent (the public site build). */
export function isSiteBuild(): boolean {
  return Boolean(getSiteAgentId());
}

/**
 * True when this site build ships the web search toggle. A second build-time
 * flag, `VITE_SITE_WEB_SEARCH=1`, because the toggle only works when the
 * whole backend (wrapper, UAR image, second agent) is live; a deploy without
 * it must not show a control that does nothing. Off unless explicitly "1".
 */
export function isWebSearchEnabled(): boolean {
  return isSiteBuild() && (import.meta.env.VITE_SITE_WEB_SEARCH as string | undefined)?.trim() === "1";
}
