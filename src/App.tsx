import { Toaster } from "@/components/ui/sonner";
import { PersistenceNotices } from "@/components/common/persistence-notices";
import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";
import { lazy, Suspense, type ComponentType } from "react";
import { DbProvider } from "@/lib/db/db-provider";
import { isSiteBuild } from "@/hooks/use-site-config";
import LandingPage from "@/pages/landing-page";
import NotFound from "@/pages/NotFound";
import { loadAppShell, loadThreadDetailPage, loadThreadsPage } from "@/lib/route-chunks";
import type { RouteObject } from "react-router-dom";

/**
 * Route-level code splitting (site-bundle-attribution). Router `lazy` keeps the
 * current screen mounted until the chunk arrives, so there is no spinner or
 * layout flash; the landing page stays in the entry chunk.
 */
const page = (load: () => Promise<{ default: ComponentType }>) => ({
  lazy: async () => ({ Component: (await load()).default }),
});

/**
 * `/agents/*` and `/settings/*` all need UAR admin APIs (compiler, providers,
 * skills CRUD, user settings) that the public site build's nginx proxy does
 * not allow — see openspec/changes/site-chat-proxy. Excluded from the router
 * entirely on that build (not just hidden from nav) so a direct link falls
 * through to the catch-all NotFound route rather than rendering a page whose
 * data calls would all 403.
 */
const adminRoutes: RouteObject[] = isSiteBuild()
  ? []
  : [
      { path: "/agents", ...page(() => import("@/pages/agents-page")) },
      { path: "/agents/new", ...page(() => import("@/pages/agent-detail-page")) },
      { path: "/agents/:id", ...page(() => import("@/pages/agent-detail-page")) },
      {
        path: "/settings",
        ...page(() => import("@/pages/settings-page")),
        children: [
          { index: true, element: <Navigate to="/settings/providers" replace /> },
          { path: "providers", ...page(() => import("@/pages/providers-page")) },
          { path: "skills", ...page(() => import("@/pages/skills-page")) },
          { path: "appearance", ...page(() => import("@/pages/appearance-page")) },
          { path: "about", ...page(() => import("@/pages/about-page")) },
          { path: "account", ...page(() => import("@/pages/user-settings-page")) },
        ],
      },
    ];

const router = createBrowserRouter([
  { path: "/", element: <LandingPage /> },
  {
    lazy: async () => ({ Component: (await loadAppShell()).default }),
    hydrateFallbackElement: <div className="h-screen bg-background" />,
    children: [
      { path: "/threads", ...page(loadThreadsPage) },
      { path: "/threads/:id", ...page(loadThreadDetailPage) },
      ...adminRoutes,
    ],
  },
  { path: "*", element: <NotFound /> },
]);

const SkillsSyncBootstrap = lazy(() => import("@/hooks/skills-sync-bootstrap"));

const App = () => (
  <DbProvider>
    <Toaster />
    <PersistenceNotices />
    {!isSiteBuild() && (
      <Suspense fallback={null}>
        <SkillsSyncBootstrap />
      </Suspense>
    )}
    <RouterProvider router={router} />
  </DbProvider>
);

export default App;
