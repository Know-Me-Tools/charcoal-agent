import { Bot, MessageSquare, Settings, type LucideIcon } from "lucide-react";

export interface NavDestination {
  to: string;
  label: string;
  icon: LucideIcon;
}

/** Top-level destinations, shared by the top bar and the phone bottom nav. */
export const NAV_DESTINATIONS: NavDestination[] = [
  { to: "/threads", label: "Threads", icon: MessageSquare },
  { to: "/agents", label: "Agents", icon: Bot },
  { to: "/settings", label: "Settings", icon: Settings },
];

/** The landing route `/` belongs to Threads. */
export function isDestinationActive(to: string, pathname: string): boolean {
  return pathname.startsWith(to) || (to === "/threads" && pathname === "/");
}
