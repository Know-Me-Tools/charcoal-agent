import { Link, useLocation } from "react-router-dom";
import { PanelRight, Sun, Moon, Menu } from "lucide-react";
import { useUi } from "@/hooks/use-ui";
import { useIsMobile } from "@/hooks/use-mobile";
import { useMediaQuery } from "@/hooks/use-media-query";
import { WIDE_LAYOUT_QUERY } from "@/components/layout/breakpoints";
import { KnowMeLockup } from "@/components/brand";
import { UarStatus } from "@/components/common/uar-status";
import { ABOUT_PANEL_ID, ABOUT_TOGGLE_ID } from "@/components/layout/about-sources-panel";
import { isSiteBuild } from "@/hooks/use-site-config";
import { ABOUT_PANEL_CONTENT } from "../../../content/site/about-panel";
import { getNavDestinations, isDestinationActive } from "@/components/layout/nav-destinations";
import { cn } from "@/lib/utils";
import { ExportMenu } from "@/features/export/export-menu";

const ICON_BUTTON_BASE =
  "flex size-8 items-center justify-center rounded-md text-muted-foreground transition-hover hover:bg-hover hover:text-foreground focus-cue";
// Critique P2-6: 44px touch targets below 768 on the site build. The 48px bar
// still fits them.
const ICON_BUTTON_SITE = cn(ICON_BUTTON_BASE, "max-md:size-11");

export function Topbar() {
  const { pathname } = useLocation();
  const { theme, setTheme, toggleRightPanel, aboutPanelOpen, setAboutPanelOpen, setContextSheetOpen, toggleMobileSidebar } =
    useUi();
  const isMobile = useIsMobile();
  const isWide = useMediaQuery(WIDE_LAYOUT_QUERY);
  const isThreadView = pathname.startsWith("/threads/");
  const threadId = /^\/threads\/([^/]+)/.exec(pathname)?.[1] ?? null;
  const showSidebar = pathname.startsWith("/threads") || pathname === "/";
  const nextTheme = theme === "dark" ? "light" : "dark";
  const siteBuild = isSiteBuild();
  const ICON_BUTTON = siteBuild ? ICON_BUTTON_SITE : ICON_BUTTON_BASE;

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
        {/* Runtime status is infra detail; on the site it showed visitors "localhost". */}
        {!isMobile && !siteBuild && <UarStatus compact />}

        <button
          type="button"
          onClick={() => setTheme(nextTheme)}
          className={ICON_BUTTON}
          aria-label={`Switch to ${nextTheme} theme`}
          title={`Switch to ${nextTheme} theme`}
        >
          {theme === "dark" ? <Sun size={16} aria-hidden="true" /> : <Moon size={16} aria-hidden="true" />}
        </button>

        {threadId && <ExportMenu threadId={threadId} triggerClassName={cn(ICON_BUTTON, "shrink-0 max-md:size-11")} />}

        {isThreadView && siteBuild && (
          <button
            type="button"
            id={ABOUT_TOGGLE_ID}
            onClick={isWide ? () => setAboutPanelOpen(!aboutPanelOpen) : () => setContextSheetOpen(true)}
            className={ICON_BUTTON}
            aria-label={ABOUT_PANEL_CONTENT.title}
            title={ABOUT_PANEL_CONTENT.title}
            {...(isWide
              ? { "aria-expanded": aboutPanelOpen, "aria-controls": aboutPanelOpen ? ABOUT_PANEL_ID : undefined }
              : { "aria-haspopup": "dialog" as const })}
          >
            <PanelRight size={16} aria-hidden="true" />
          </button>
        )}

        {isThreadView && !siteBuild && (
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
