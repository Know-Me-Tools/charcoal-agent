import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";
import type React from "react";
import { DbProvider } from "@/lib/db/db-provider";
import { GraphProvider } from "@/lib/entity-graph/graph-provider";
import { AppLayout } from "@/components/layout/app-layout";
import { useSkillsSyncOnMount } from "@/hooks/use-skills-sync";
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

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const router = createBrowserRouter([
  { path: "/", element: <LandingPage /> },
  {
    element: <AppLayout />,
    children: [
      { path: "/threads", element: <ThreadsPage /> },
      { path: "/threads/:id", element: <ThreadDetailPage /> },
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
    ],
  },
  { path: "*", element: <NotFound /> },
]);

/**
 * Runs app-wide one-time effects that need QueryClient + DB to be ready.
 * Rendered inside all providers so hooks have full context.
 */
function AppBootstrap({ children }: { children: React.ReactNode }) {
  useSkillsSyncOnMount();
  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <GraphProvider>
    <DbProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AppBootstrap>
          <RouterProvider router={router} />
        </AppBootstrap>
      </TooltipProvider>
    </DbProvider>
    </GraphProvider>
  </QueryClientProvider>
);

export default App;
