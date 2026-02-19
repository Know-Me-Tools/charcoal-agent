import type { RunStatus } from "@/types";

const statusConfig: Record<string, { bg: string; text: string; dot: string }> = {
  active: { bg: "bg-success/10", text: "text-success", dot: "bg-success" },
  streaming: { bg: "bg-info/10", text: "text-info", dot: "bg-info" },
  complete: { bg: "bg-muted", text: "text-muted-foreground", dot: "bg-muted-foreground" },
  pending: { bg: "bg-warning/10", text: "text-warning", dot: "bg-warning" },
  failed: { bg: "bg-destructive/10", text: "text-destructive", dot: "bg-destructive" },
  running: { bg: "bg-info/10", text: "text-info", dot: "bg-info" },
  connected: { bg: "bg-success/10", text: "text-success", dot: "bg-success" },
  disconnected: { bg: "bg-destructive/10", text: "text-destructive", dot: "bg-destructive" },
  enabled: { bg: "bg-success/10", text: "text-success", dot: "bg-success" },
  disabled: { bg: "bg-muted", text: "text-muted-foreground", dot: "bg-muted-foreground" },
  calling: { bg: "bg-warning/10", text: "text-warning", dot: "bg-warning" },
};

interface StatusBadgeProps {
  status: RunStatus | string;
  className?: string;
}

export function StatusBadge({ status, className = "" }: StatusBadgeProps) {
  const config = statusConfig[status] ?? statusConfig.complete;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-sm px-2 py-0.5 font-ui text-[11px] font-semibold ${config.bg} ${config.text} ${className}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />
      {status}
    </span>
  );
}
