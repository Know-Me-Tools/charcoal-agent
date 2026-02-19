import { NavLink, useLocation } from "react-router-dom";
import { MessageSquare, Bot, Settings } from "lucide-react";

const navItems = [
  { to: "/threads", label: "Threads", icon: MessageSquare },
  { to: "/agents", label: "Agents", icon: Bot },
  { to: "/settings", label: "Settings", icon: Settings },
];

export function MobileBottomNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-14 items-center justify-around border-t border-border bg-card md:hidden">
      {navItems.map((item) => {
        const isActive =
          location.pathname.startsWith(item.to) ||
          (item.to === "/threads" && location.pathname === "/");
        return (
          <NavLink
            key={item.to}
            to={item.to}
            className={`flex flex-1 flex-col items-center justify-center gap-0.5 py-1 font-ui text-[10px] font-semibold transition-hover ${
              isActive ? "text-primary" : "text-muted-foreground"
            }`}
          >
            <item.icon size={20} />
            <span>{item.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}
