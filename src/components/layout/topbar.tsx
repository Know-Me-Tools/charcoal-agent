import { Link, useLocation } from "react-router-dom";
import { PanelRight, Sun, Moon, Menu } from "lucide-react";
import { useUi } from "@/hooks/use-ui";
import { useIsMobile } from "@/hooks/use-mobile";
import { useMediaQuery } from "@/hooks/use-media-query";
import { WIDE_LAYOUT_QUERY } from "@/components/layout/breakpoints";
import { KnowMeLockup } from "@/components/brand";
import { UarStatus } from "@/components/common/uar-status";
import { getNavDestinations, isDestinationActive } from "@/components/layout/nav-destinations";
import { cn } from "@/lib/utils";

const ICON_BUTTON =
  "flex size-8 items-center justify-center rounded-md text-muted-foreground transition-hover hover:bg-hover hover:text-foreground focus-cue";

export function Topbar() {
  const { pathname } = useLocation();
  const { theme, setTheme, toggleRightPanel, setContextSheetOpen, toggleMobileSidebar } = useUi();
  const isMobile = useIsMobile();
  const isWide = useMediaQuery(WIDE_LAYOUT_QUERY);
  const isThreadView = pathname.startsWith("/threads/");
  const showSidebar = pathname.startsWith("/threads") || pathname === "/";
  const nextTheme = theme === "dark" ? "light" : "dark";

  return (
    <header className="fixed top-0 right-0 left-0 z-50 flex h-12 shrink-0 items-center justify-between bg-chrome px-4 md:static">
      <div className="flex items-center gap-3">
        {isMobile && showSidebar && (
          <button type="button" onClick={toggleMobileSidebar} className={ICON_BUTTON} aria-label="Open threads">
            <Menu size={20} aria-hidden="true" />
          </button>
        )}

        <Link to="/" className="flex items-center rounded-md focus-cue">
          <KnowMeLockup variant="nav" />
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
          {getNavDestinations().map(({ to, label }) => {
            const active = isDestinationActive(to, pathname);
            return (
              <Link
                key={to}
                to={to}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "rounded-md px-3 py-1.5 font-ui text-sm font-semibold transition-hover focus-cue",
                  active ? "bg-ember-soft text-foreground" : "text-muted-foreground hover:bg-hover hover:text-foreground",
                )}
              >
                {label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="flex items-center gap-2">
        {!isMobile && <UarStatus compact />}

        <button
          type="button"
          onClick={() => setTheme(nextTheme)}
          className={ICON_BUTTON}
          aria-label={`Switch to ${nextTheme} theme`}
          title={`Switch to ${nextTheme} theme`}
        >
          {theme === "dark" ? <Sun size={16} aria-hidden="true" /> : <Moon size={16} aria-hidden="true" />}
        </button>

        {isThreadView && (
          <button
            type="button"
            onClick={isWide ? toggleRightPanel : () => setContextSheetOpen(true)}
            className={ICON_BUTTON}
            aria-label="Toggle context panel"
            title="Toggle context panel"
          >
            <PanelRight size={16} aria-hidden="true" />
          </button>
        )}
      </div>
    </header>
  );
}
