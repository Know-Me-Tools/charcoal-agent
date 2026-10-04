import { Bot, MessageSquare, Settings, type LucideIcon } from "lucide-react";
import { isSiteBuild } from "@/hooks/use-site-config";

export interface NavDestination {
  to: string;
  label: string;
  icon: LucideIcon;
}

const ALL_NAV_DESTINATIONS: NavDestination[] = [
  { to: "/threads", label: "Threads", icon: MessageSquare },
  { to: "/agents", label: "Agents", icon: Bot },
  { to: "/settings", label: "Settings", icon: Settings },
];

/**
 * Top-level destinations, shared by the top bar and the phone bottom nav.
 * On the public site build (`VITE_SITE_AGENT_ID` set) Agents and Settings
 * are hidden — those routes call UAR admin APIs the site proxy does not
 * allow, and the corresponding routes are excluded from the router too
 * (see src/App.tsx).
 */
export function getNavDestinations(): NavDestination[] {
  if (!isSiteBuild()) return ALL_NAV_DESTINATIONS;
  return ALL_NAV_DESTINATIONS.filter((d) => d.to === "/threads");
}

/** The landing route `/` belongs to Threads. */
export function isDestinationActive(to: string, pathname: string): boolean {
  return pathname.startsWith(to) || (to === "/threads" && pathname === "/");
}
