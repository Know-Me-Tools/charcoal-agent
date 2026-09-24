import { useHealth } from "@/hooks/use-health";
import { SectionLabel } from "@/components/common/section-label";
import { StatusBadge } from "@/components/common/status-badge";
import { KnowMeLockup } from "@/components/brand";

const APP_VERSION = "0.1.0";
const UAR_BASE = (import.meta.env.VITE_UAR_BASE_URL as string | undefined) ?? "http://localhost:6565";

export default function AboutPage() {
  const { data: health } = useHealth();

  return (
    <div className="max-w-lg space-y-8">
      <div>
        <SectionLabel>About</SectionLabel>
        <h1 className="mt-2">
          <KnowMeLockup variant="nav" />
        </h1>
        <p className="mt-2 font-mono text-xs text-faint">© 2026 KnowMe AI, LLC</p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between rounded-lg border border-border bg-card p-4">
          <span className="font-ui text-sm text-muted-foreground">Version</span>
          <span className="font-mono text-sm text-foreground">{APP_VERSION}</span>
        </div>

        <div className="flex items-center justify-between rounded-lg border border-border bg-card p-4">
          <span className="font-ui text-sm text-muted-foreground">UAR Status</span>
          <StatusBadge
            status={health?.status === "ok" ? "connected" : "disconnected"}
          />
        </div>

        <div className="flex items-center justify-between rounded-lg border border-border bg-card p-4">
          <span className="font-ui text-sm text-muted-foreground">UAR Endpoint</span>
          <span className="max-w-xs truncate font-mono text-sm text-foreground">{UAR_BASE}</span>
        </div>

        <div className="flex items-center justify-between rounded-lg border border-border bg-card p-4">
          <span className="font-ui text-sm text-muted-foreground">Runtime</span>
          <span className="font-mono text-sm text-foreground">Universal Agent Runtime</span>
        </div>
      </div>
    </div>
  );
}
