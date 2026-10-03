import { Toaster } from "@/components/ui/sonner";
import { PersistenceNotices } from "@/components/common/persistence-notices";
import { TooltipProvider } from "@/components/ui/tooltip";
import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";
import type React from "react";
import { DbProvider } from "@/lib/db/db-provider";
import { GraphProvider } from "@/lib/entity-graph/graph-provider";
import { AppLayout } from "@/components/layout/app-layout";
import { useSkillsSyncOnMount } from "@/hooks/use-skills-sync";
import { isSiteBuild } from "@/hooks/use-site-config";
import LandingPage from "@/pages/landing-page";
import ThreadsPage from "@/pages/threads-page";
import ThreadDetailPage from "@/pages/thread-detail-page";
import AgentsPage from "@/pages/agents-page";
import AgentDetailPage from "@/pages/agent-detail-page";
import SettingsPage from "@/pages/settings-page";
import ProvidersPage from "@/pages/providers-page";
import SkillsPage from "@/pages/skills-page";
import AppearancePage from "@/pages/appearance-page";
import AboutPage from "@/pages/about-page";
import UserSettingsPage from "@/pages/user-settings-page";
import NotFound from "@/pages/NotFound";
import type { RouteObject } from "react-router-dom";

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
      { path: "/agents", element: <AgentsPage /> },
      { path: "/agents/new", element: <AgentDetailPage /> },
      { path: "/agents/:id", element: <AgentDetailPage /> },
      {
        path: "/settings",
        element: <SettingsPage />,
        children: [
          { index: true, element: <Navigate to="/settings/providers" replace /> },
          { path: "providers", element: <ProvidersPage /> },
          { path: "skills", element: <SkillsPage /> },
          { path: "appearance", element: <AppearancePage /> },
          { path: "about", element: <AboutPage /> },
          { path: "account", element: <UserSettingsPage /> },
        ],
      },
    ];

const router = createBrowserRouter([
  { path: "/", element: <LandingPage /> },
  {
    element: <AppLayout />,
    children: [
      { path: "/threads", element: <ThreadsPage /> },
      { path: "/threads/:id", element: <ThreadDetailPage /> },
      ...adminRoutes,
    ],
  },
  { path: "*", element: <NotFound /> },
]);

/**
 * Runs app-wide one-time effects that need the entity graph + DB to be ready.
 * Rendered inside all providers so hooks have full context.
 */
function AppBootstrap({ children }: { children: React.ReactNode }) {
  useSkillsSyncOnMount();
  return <>{children}</>;
}

const App = () => (
  <GraphProvider>
    <DbProvider>
      <TooltipProvider>
        <Toaster />
        <PersistenceNotices />
        <AppBootstrap>
          <RouterProvider router={router} />
        </AppBootstrap>
      </TooltipProvider>
    </DbProvider>
  </GraphProvider>
);

export default App;
