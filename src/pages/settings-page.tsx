import { NavLink, Outlet } from "react-router-dom";
import { Server, Wrench, Palette, Info, UserCog } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { SectionLabel } from "@/components/common/section-label";
import { useIsMobile } from "@/hooks/use-mobile";
import { isJwtConfigured } from "@/lib/api-client";
import { cn } from "@/lib/utils";

const BASE_NAV = [
  { to: "/settings/providers", label: "Providers", icon: Server },
  { to: "/settings/skills", label: "Skills", icon: Wrench },
  { to: "/settings/appearance", label: "Appearance", icon: Palette },
  { to: "/settings/about", label: "About", icon: Info },
];

function useSettingsNav() {
  const items = [...BASE_NAV];
  if (isJwtConfigured()) {
    items.push({ to: "/settings/account", label: "Account", icon: UserCog });
  }
  return items;
}

export default function SettingsPage() {
  const isMobile = useIsMobile();
  const settingsNav = useSettingsNav();

  return (
    <div className="flex flex-1 flex-col md:flex-row">
      {isMobile ? (
        /* Mobile: horizontal scrollable tabs */
        <ScrollArea className="shrink-0 border-b border-border bg-card">
          <nav className="flex items-center gap-1 px-3 py-2">
            {settingsNav.map((item) => (
              <NavLink key={item.to} to={item.to}>
                {({ isActive }) => (
                  <Button
                    variant={isActive ? "secondary" : "ghost"}
                    size="sm"
                    className={cn(
                      "shrink-0 gap-1.5 font-ui text-[13px] font-semibold",
                      isActive ? "text-foreground" : "text-muted-foreground",
                    )}
                  >
                    <item.icon size={14} />
                    {item.label}
                  </Button>
                )}
              </NavLink>
            ))}
          </nav>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      ) : (
        /* Desktop: side nav */
        <aside className="flex w-[200px] shrink-0 flex-col border-r border-border bg-card p-4">
          <SectionLabel>Settings</SectionLabel>
          <Separator className="my-3" />
          <nav className="flex flex-col gap-0.5">
            {settingsNav.map((item) => (
              <NavLink key={item.to} to={item.to}>
                {({ isActive }) => (
                  <Button
                    variant={isActive ? "secondary" : "ghost"}
                    size="sm"
                    className={cn(
                      "w-full justify-start gap-2.5 font-ui text-[13px] font-semibold",
                      isActive ? "text-foreground" : "text-muted-foreground",
                    )}
                  >
                    <item.icon size={14} />
                    {item.label}
                  </Button>
                )}
              </NavLink>
            ))}
          </nav>
        </aside>
      )}

      <ScrollArea className="flex-1">
        <div className="p-4 md:p-6">
          <Outlet />
        </div>
      </ScrollArea>
    </div>
  );
}
