/**
 * UAR Connection Status Indicator
 *
 * Shows the hostname of the connected UAR and a colour-coded dot indicating
 * whether the runtime is reachable (green), checking (yellow), or offline (red).
 */

import { Wifi, WifiOff } from "lucide-react";
import { useHealth } from "@/hooks/use-health";

const UAR_BASE = (import.meta.env.VITE_UAR_BASE_URL as string | undefined) ?? "";

function getHostname(url: string): string {
  if (!url) return "localhost";
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

interface UarStatusProps {
  /** Compact mode — only shows the dot, no text. Useful for tight layouts. */
  compact?: boolean;
}

export function UarStatus({ compact = false }: UarStatusProps) {
  const { data: health, isLoading, isError } = useHealth();

  const isConnected = health?.status === "ok";
  const hostname = getHostname(UAR_BASE);

  const dotColor = isLoading
    ? "bg-amber-400"
    : isConnected
      ? "bg-green-400"
      : "bg-destructive";

  const dotTitle = isLoading
    ? "Checking UAR connection…"
    : isConnected
      ? `Connected to ${hostname}`
      : `Cannot reach ${hostname}`;

  if (compact) {
    return (
      <span
        title={dotTitle}
        className={`inline-block h-2 w-2 rounded-full ${dotColor} ${isLoading ? "animate-pulse" : ""}`}
      />
    );
  }

  return (
    <div
      title={dotTitle}
      className="flex items-center gap-2 rounded-md px-2.5 py-1.5"
    >
      {isConnected ? (
        <Wifi size={13} className="shrink-0 text-green-400" />
      ) : (
        <WifiOff size={13} className="shrink-0 text-muted-foreground" />
      )}

      <div className="min-w-0 flex-1">
        <p className="truncate font-mono text-[10px] text-muted-foreground">
          {hostname}
        </p>
      </div>

      <span
        className={`h-2 w-2 shrink-0 rounded-full ${dotColor} ${isLoading ? "animate-pulse" : ""}`}
      />
    </div>
  );
}
