import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/app-layout";
import ThreadsPage from "@/pages/threads-page";
import ThreadDetailPage from "@/pages/thread-detail-page";
import AgentsPage from "@/pages/agents-page";
import AgentDetailPage from "@/pages/agent-detail-page";
import SettingsPage from "@/pages/settings-page";
import ProvidersPage from "@/pages/providers-page";
import SkillsPage from "@/pages/skills-page";
import AppearancePage from "@/pages/appearance-page";
import AboutPage from "@/pages/about-page";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Navigate to="/threads" replace />} />
            <Route path="/threads" element={<ThreadsPage />} />
            <Route path="/threads/:id" element={<ThreadDetailPage />} />
            <Route path="/agents" element={<AgentsPage />} />
            <Route path="/agents/new" element={<AgentDetailPage />} />
            <Route path="/agents/:id" element={<AgentDetailPage />} />
            <Route path="/settings" element={<SettingsPage />}>
              <Route index element={<Navigate to="/settings/providers" replace />} />
              <Route path="providers" element={<ProvidersPage />} />
              <Route path="skills" element={<SkillsPage />} />
              <Route path="appearance" element={<AppearancePage />} />
              <Route path="about" element={<AboutPage />} />
            </Route>
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
