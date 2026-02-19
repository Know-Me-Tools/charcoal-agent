import { Outlet, useLocation } from "react-router-dom";
import { Topbar } from "@/components/layout/topbar";
import { LeftSidebar } from "@/components/layout/left-sidebar";
import { RightContextPanel } from "@/components/layout/right-context-panel";

export function AppLayout() {
  const location = useLocation();
  const isThreadView = location.pathname.startsWith("/threads/");
  const showSidebar = location.pathname.startsWith("/threads") || location.pathname === "/";

  return (
    <div className="flex h-screen flex-col bg-background">
      <Topbar />
      <div className="flex min-h-0 flex-1">
        {showSidebar && <LeftSidebar />}
        <main className="flex min-w-0 flex-1 flex-col grid-overlay">
          <Outlet />
        </main>
        {isThreadView && <RightContextPanel />}
      </div>
    </div>
  );
}
