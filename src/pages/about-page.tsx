import { useHealth } from "@/hooks/use-health";
import { SectionLabel } from "@/components/common/section-label";
import { StatusBadge } from "@/components/common/status-badge";

const APP_VERSION = "0.1.0";

export default function AboutPage() {
  const { data: health } = useHealth();

  return (
    <div className="max-w-lg space-y-8">
      <div>
        <SectionLabel>About</SectionLabel>
        <h1 className="mt-1 font-display text-2xl font-bold text-foreground">
          KnowMe
        </h1>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between rounded-lg border border-border bg-card p-4">
          <span className="font-ui text-sm text-muted-foreground">Version</span>
          <span className="font-mono text-sm text-foreground">{APP_VERSION}</span>
        </div>

        <div className="flex items-center justify-between rounded-lg border border-border bg-card p-4">
          <span className="font-ui text-sm text-muted-foreground">Backend Status</span>
          <StatusBadge
            status={health?.status === "ok" ? "connected" : "disconnected"}
          />
        </div>

        <div className="flex items-center justify-between rounded-lg border border-border bg-card p-4">
          <span className="font-ui text-sm text-muted-foreground">Runtime</span>
          <span className="font-mono text-sm text-foreground">KnowMe Agent Runtime</span>
        </div>
      </div>
    </div>
  );
}
