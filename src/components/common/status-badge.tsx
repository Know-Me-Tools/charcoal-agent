import type { RunStatus } from "@/types";

const statusConfig: Record<string, { bg: string; text: string; dot: string }> = {
  active: { bg: "bg-success-soft", text: "text-success-text", dot: "bg-success" },
  streaming: { bg: "bg-cyan-soft", text: "text-cyan-text", dot: "bg-info" },
  complete: { bg: "bg-muted-surface", text: "text-muted-foreground", dot: "bg-muted-foreground" },
  pending: { bg: "bg-warning-soft", text: "text-warning-text", dot: "bg-warning" },
  failed: { bg: "bg-danger-soft", text: "text-danger-text", dot: "bg-destructive" },
  running: { bg: "bg-cyan-soft", text: "text-cyan-text", dot: "bg-info" },
  connected: { bg: "bg-success-soft", text: "text-success-text", dot: "bg-success" },
  disconnected: { bg: "bg-danger-soft", text: "text-danger-text", dot: "bg-destructive" },
  enabled: { bg: "bg-success-soft", text: "text-success-text", dot: "bg-success" },
  disabled: { bg: "bg-muted-surface", text: "text-muted-foreground", dot: "bg-muted-foreground" },
  calling: { bg: "bg-warning-soft", text: "text-warning-text", dot: "bg-warning" },
};

interface StatusBadgeProps {
  status: RunStatus | string;
  className?: string;
}

export function StatusBadge({ status, className = "" }: StatusBadgeProps) {
  const config = statusConfig[status] ?? statusConfig.complete;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-pill px-2 py-0.5 font-ui text-xs font-semibold ${config.bg} ${config.text} ${className}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />
      {status}
    </span>
  );
}
