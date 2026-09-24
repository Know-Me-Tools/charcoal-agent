/**
 * Universal Agent Runtime connection status.
 *
 * State is shown with a status tone, an icon and a text label together, so it
 * never depends on colour alone (KnowMe UI/UX standard §3.3, §11).
 */

import { Loader2, Wifi, WifiOff, type LucideIcon } from "lucide-react";
import { useHealth } from "@/hooks/use-health";
import { cn } from "@/lib/utils";

const UAR_BASE = (import.meta.env.VITE_UAR_BASE_URL as string | undefined) ?? "";

type RuntimeState = "checking" | "connected" | "offline";

const STATE: Record<RuntimeState, { label: string; icon: LucideIcon; tone: string; fill: string }> = {
  checking: { label: "Checking", icon: Loader2, tone: "text-warning-text", fill: "bg-warning-soft" },
  connected: { label: "Connected", icon: Wifi, tone: "text-success-text", fill: "bg-success-soft" },
  offline: { label: "Offline", icon: WifiOff, tone: "text-danger-text", fill: "bg-danger-soft" },
};

function getHostname(url: string): string {
  if (!url) return "localhost";
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

interface UarStatusProps {
  /** Pill with icon and label only, for the top bar. */
  compact?: boolean;
}

export function UarStatus({ compact = false }: UarStatusProps) {
  const { data: health, isLoading } = useHealth();

  const state: RuntimeState = isLoading ? "checking" : health?.status === "ok" ? "connected" : "offline";
  const { label, icon: Icon, tone, fill } = STATE[state];
  const hostname = getHostname(UAR_BASE);
  const description = `Runtime ${label.toLowerCase()} (${hostname})`;
  const icon = <Icon size={14} aria-hidden="true" className={cn("shrink-0", tone, state === "checking" && "animate-spin")} />;

  if (compact) {
    return (
      <span
        role="status"
        aria-label={description}
        title={description}
        className={cn("inline-flex items-center gap-1.5 rounded-pill px-2.5 py-1 font-ui text-xs font-semibold", fill, tone)}
      >
        {icon}
        <span>{label}</span>
      </span>
    );
  }

  return (
    <div role="status" aria-label={description} title={description} className="flex items-center gap-2 rounded-md px-2.5 py-1.5">
      {icon}
      <span className={cn("font-ui text-xs font-semibold", tone)}>{label}</span>
      <span className="min-w-0 flex-1 truncate text-right font-mono text-xs text-faint">{hostname}</span>
    </div>
  );
}
