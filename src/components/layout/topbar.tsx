import { Link, useLocation } from "react-router-dom";
import { PanelRight, Sun, Moon, Menu } from "lucide-react";
import { useUi } from "@/hooks/use-ui";
import { useIsMobile } from "@/hooks/use-mobile";

export function Topbar() {
  const location = useLocation();
  const { theme, setTheme, toggleRightPanel, toggleMobileSidebar } = useUi();
  const isMobile = useIsMobile();
  const isThreadView = location.pathname.startsWith("/threads/");
  const showSidebar = location.pathname.startsWith("/threads") || location.pathname === "/";

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex h-12 shrink-0 items-center justify-between border-b border-border bg-card px-4 md:static">
      <div className="flex items-center gap-3">
        {/* Hamburger menu on mobile when sidebar is relevant */}
        {isMobile && showSidebar && (
          <button
            onClick={toggleMobileSidebar}
            className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-hover hover:bg-muted hover:text-foreground"
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>
        )}

        <Link to="/" className="flex items-center gap-2">
          <span className="font-display text-lg font-bold tracking-tight text-foreground">
            KnowMe
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 md:flex">
          <TopbarLink to="/threads" label="Threads" active={location.pathname.startsWith("/threads")} />
          <TopbarLink to="/agents" label="Agents" active={location.pathname.startsWith("/agents")} />
          <TopbarLink to="/settings" label="Settings" active={location.pathname.startsWith("/settings")} />
        </nav>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-hover hover:bg-muted hover:text-foreground"
          title="Toggle theme"
        >
          {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        {isThreadView && !isMobile && (
          <button
            onClick={toggleRightPanel}
            className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-hover hover:bg-muted hover:text-foreground"
            title="Toggle context panel"
          >
            <PanelRight size={16} />
          </button>
        )}
      </div>
    </header>
  );
}

function TopbarLink({ to, label, active }: { to: string; label: string; active: boolean }) {
  return (
    <Link
      to={to}
      className={`rounded-md px-3 py-1.5 font-ui text-[13px] font-semibold transition-hover ${
        active
          ? "bg-muted text-foreground"
          : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
      }`}
    >
      {label}
    </Link>
  );
}
