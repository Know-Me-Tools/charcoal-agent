import { Outlet, useLocation } from "react-router-dom";
import { Topbar } from "@/components/layout/topbar";
import { LeftSidebar } from "@/components/layout/left-sidebar";
import { RightContextPanel } from "@/components/layout/right-context-panel";
import { MobileBottomNav } from "@/components/layout/mobile-nav";
import { MobileSidebarDrawer } from "@/components/layout/mobile-sidebar-drawer";
import { useIsMobile } from "@/hooks/use-mobile";
import { useDbHydration } from "@/hooks/use-db-hydration";

export function AppLayout() {
  useDbHydration();
  const location = useLocation();
  const isMobile = useIsMobile();
  const isThreadView = location.pathname.startsWith("/threads/");
  const showSidebar = location.pathname.startsWith("/threads") || location.pathname === "/";

  return (
    <div className="flex h-screen flex-col bg-background">
      <Topbar />

      {/* Mobile sidebar drawer */}
      {isMobile && showSidebar && (
        <MobileSidebarDrawer>
          <LeftSidebar />
        </MobileSidebarDrawer>
      )}

      {/* Spacer for fixed topbar on mobile */}
      <div className="h-12 shrink-0 md:hidden" />

      <div className="flex min-h-0 flex-1">
        {/* Desktop sidebar */}
        {!isMobile && showSidebar && (
          <LeftSidebar className="w-[260px] shrink-0 border-r border-border" />
        )}

        <main className="flex min-w-0 flex-1 flex-col">
          <Outlet />
        </main>

        {/* Desktop right panel */}
        {!isMobile && isThreadView && <RightContextPanel />}
      </div>

      {/* Mobile bottom nav */}
      {isMobile && <MobileBottomNav />}

      {/* Spacer for fixed bottom nav on mobile */}
      {isMobile && <div className="h-14 shrink-0 md:hidden" />}
    </div>
  );
}
