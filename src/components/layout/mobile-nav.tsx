import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { NAV_DESTINATIONS, isDestinationActive } from "@/components/layout/nav-destinations";

export function MobileBottomNav() {
  const { pathname } = useLocation();

  return (
    <nav
      aria-label="Main"
      className="fixed right-0 bottom-0 left-0 z-50 flex h-14 items-stretch gap-1 bg-chrome px-2 py-1.5 md:hidden"
    >
      {NAV_DESTINATIONS.map(({ to, label, icon: Icon }) => {
        const active = isDestinationActive(to, pathname);
        return (
          <Link
            key={to}
            to={to}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-0.5 rounded-lg font-ui text-xs font-semibold transition-hover focus-cue",
              active ? "bg-ember-soft text-foreground" : "text-muted-foreground hover:bg-hover hover:text-foreground",
            )}
          >
            <Icon size={18} aria-hidden="true" className={active ? "text-ember-text" : undefined} />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
