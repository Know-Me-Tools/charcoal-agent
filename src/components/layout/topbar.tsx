import { Link, useLocation } from "react-router-dom";
import { PanelRight, Settings, Bot, Sun, Moon } from "lucide-react";
import { useUi } from "@/hooks/use-ui";

export function Topbar() {
  const location = useLocation();
  const { theme, setTheme, toggleRightPanel } = useUi();
  const isThreadView = location.pathname.startsWith("/threads/");

  return (
    <header className="flex h-12 shrink-0 items-center justify-between border-b border-border bg-card px-4">
      <div className="flex items-center gap-4">
        <Link to="/" className="flex items-center gap-2">
          <span className="font-display text-lg font-bold tracking-tight text-foreground">
            KnowMe
          </span>
        </Link>

        <nav className="flex items-center gap-1">
          <TopbarLink to="/threads" label="Threads" active={location.pathname.startsWith("/threads") || location.pathname === "/"} />
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

        {isThreadView && (
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
