import { NavLink, Outlet, useLocation } from "react-router-dom";
import { Server, Wrench, Palette, Info } from "lucide-react";
import { SectionLabel } from "@/components/common/section-label";
import { useIsMobile } from "@/hooks/use-mobile";

const settingsNav = [
  { to: "/settings/providers", label: "Providers", icon: Server },
  { to: "/settings/skills", label: "Skills", icon: Wrench },
  { to: "/settings/appearance", label: "Appearance", icon: Palette },
  { to: "/settings/about", label: "About", icon: Info },
];

export default function SettingsPage() {
  const isMobile = useIsMobile();

  return (
    <div className="flex flex-1 flex-col md:flex-row">
      {/* Mobile: horizontal scrollable tabs; Desktop: side nav */}
      {isMobile ? (
        <nav className="flex shrink-0 items-center gap-1 overflow-x-auto border-b border-border bg-card px-3 py-2">
          {settingsNav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 font-ui text-[13px] font-semibold transition-hover ${
                  isActive
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`
              }
            >
              <item.icon size={14} />
              {item.label}
            </NavLink>
          ))}
        </nav>
      ) : (
        <nav className="flex w-[200px] shrink-0 flex-col border-r border-border bg-card p-4">
          <SectionLabel>Settings</SectionLabel>
          <div className="mt-3 space-y-0.5">
            {settingsNav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 rounded-md px-3 py-2 font-ui text-[13px] font-semibold transition-hover ${
                    isActive
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                  }`
                }
              >
                <item.icon size={14} />
                {item.label}
              </NavLink>
            ))}
          </div>
        </nav>
      )}
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        <Outlet />
      </div>
    </div>
  );
}
