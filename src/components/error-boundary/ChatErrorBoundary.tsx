import { ErrorBoundary, type FallbackProps } from "react-error-boundary";
import { AlertTriangle, ChevronDown, ChevronRight, RefreshCw } from "lucide-react";
import { useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

// ─── Fallback UI ──────────────────────────────────────────────────────────────

function ChatErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);

  const isDev = import.meta.env.DEV;
  const stack = error instanceof Error ? error.stack : undefined;

  return (
    <div className="flex flex-1 flex-col items-center justify-center p-8">
      <div className="w-full max-w-lg space-y-4">
        {/* Header */}
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle size={18} className="text-danger-text" />
          </span>
          <div>
            <h2 className="font-display text-base font-semibold text-foreground">
              Something went wrong
            </h2>
            <p className="mt-0.5 font-mono text-sm text-muted-foreground">
              {error instanceof Error ? error.message : String(error)}
            </p>
          </div>
        </div>

        {/* Stack trace — dev only, collapsible */}
        {isDev && stack && (
          <div className="rounded-lg border border-border bg-muted/40">
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="flex w-full items-center gap-2 px-3 py-2 font-mono text-[11px] text-muted-foreground hover:text-foreground"
            >
              {expanded ? (
                <ChevronDown size={12} />
              ) : (
                <ChevronRight size={12} />
              )}
              Stack trace
            </button>
            {expanded && (
              <pre className="overflow-x-auto border-t border-border px-3 py-2 font-mono text-[11px] leading-relaxed text-foreground/80">
                {stack}
              </pre>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={resetErrorBoundary}
            className="gap-2"
          >
            <RefreshCw size={14} />
            Retry
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate("/")}
          >
            Back to home
          </Button>
        </div>

        <p className="font-mono text-[10px] text-muted-foreground">
          // The rest of the app is still running
        </p>
      </div>
    </div>
  );
}

// ─── Exported boundary wrapper ─────────────────────────────────────────────────

interface ChatErrorBoundaryProps {
  children: ReactNode;
  /**
   * Key that resets the boundary when it changes (e.g. the thread ID).
   * Pass the active thread ID so navigating to a new thread auto-resets.
   */
  resetKey?: string;
}

export function ChatErrorBoundary({ children, resetKey }: ChatErrorBoundaryProps) {
  return (
    <ErrorBoundary
      FallbackComponent={ChatErrorFallback}
      resetKeys={resetKey ? [resetKey] : undefined}
      onError={(error, info) => {
        // In production you'd send this to an error tracking service (Sentry, etc.)
        console.error("[ChatErrorBoundary]", error, info.componentStack);
      }}
    >
      {children}
    </ErrorBoundary>
  );
}
