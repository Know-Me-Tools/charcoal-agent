import { Outlet, useLocation } from "react-router-dom";
import { Topbar } from "@/components/layout/topbar";
import { LeftSidebar } from "@/components/layout/left-sidebar";
import { ContextPanelSheet, RightContextPanel } from "@/components/layout/right-context-panel";
import { MobileBottomNav } from "@/components/layout/mobile-nav";
import { MobileSidebarDrawer } from "@/components/layout/mobile-sidebar-drawer";
import { useIsMobile } from "@/hooks/use-mobile";
import { useMediaQuery } from "@/hooks/use-media-query";
import { WIDE_LAYOUT_QUERY } from "@/components/layout/breakpoints";
import { useDbHydration } from "@/hooks/use-db-hydration";

/** Fragment navigation doesn't reliably move focus, so the skip link does it. */
function focusMain(event: React.MouseEvent<HTMLAnchorElement>): void {
  const main = document.getElementById("main");
  if (!main) return;
  event.preventDefault();
  main.focus();
}

export function AppLayout() {
  useDbHydration();
  const location = useLocation();
  const isMobile = useIsMobile();
  const isWide = useMediaQuery(WIDE_LAYOUT_QUERY);
  const isThreadView = location.pathname.startsWith("/threads/");
  const showSidebar = location.pathname.startsWith("/threads") || location.pathname === "/";

  return (
    <div className="flex h-screen flex-col bg-canvas">
      <a
        href="#main"
        onClick={focusMain}
        className="sr-only rounded-md bg-raised px-3 py-2 font-ui text-sm font-semibold text-foreground focus:not-sr-only focus:fixed focus:top-2 focus:left-4 focus:z-100 focus-cue"
      >
        Skip to content
      </a>
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
          <LeftSidebar className="w-[260px] shrink-0" />
        )}

        <main id="main" tabIndex={-1} className="flex min-w-0 flex-1 flex-col bg-canvas outline-none">
          <Outlet />
        </main>

        {/* Desktop right panel */}
        {isWide && isThreadView && <RightContextPanel />}
      </div>

      {!isWide && isThreadView && <ContextPanelSheet />}

      {/* Mobile bottom nav */}
      {isMobile && <MobileBottomNav />}

      {/* Spacer for fixed bottom nav on mobile */}
      {isMobile && <div className="h-14 shrink-0 md:hidden" />}
    </div>
  );
}
