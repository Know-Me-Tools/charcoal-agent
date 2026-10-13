/**
 * Dynamic-import loaders for the route chunks that sit behind the landing page.
 * Shared by the router (`App.tsx`) and the landing composer, which calls
 * `prefetchThreadRoutes` on focus so the chunks are fetched while the visitor
 * types instead of competing with the first paint.
 */
export const loadAppShell = () => import("@/components/layout/app-shell");
export const loadThreadsPage = () => import("@/pages/threads-page");
export const loadThreadDetailPage = () => import("@/pages/thread-detail-page");

let prefetched = false;

/** Start fetching the thread screen's chunks; safe to call repeatedly. */
export function prefetchThreadRoutes(): void {
  if (prefetched) return;
  prefetched = true;
  void loadAppShell();
  void loadThreadDetailPage();
}
