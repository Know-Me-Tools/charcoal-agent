import { useState } from "react";
import { Wrench, ChevronDown, ChevronRight, Check, Loader2, AlertCircle } from "lucide-react";
import { StatusBadge } from "@/components/common/status-badge";
import type { ToolCallEvent } from "@/types";

interface ToolCallCardProps {
  toolCall: ToolCallEvent;
}

export function ToolCallCard({ toolCall }: ToolCallCardProps) {
  const [expanded, setExpanded] = useState(false);

  const StatusIcon = toolCall.status === "calling"
    ? Loader2
    : toolCall.status === "complete"
    ? Check
    : AlertCircle;

  return (
    <div className="my-2 rounded-lg border border-border bg-card">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-3 p-3 text-left transition-hover hover:bg-muted/30"
      >
        <Wrench size={14} className="shrink-0 text-primary" />
        <span className="font-mono text-sm font-medium text-primary">
          {toolCall.tool_name}
        </span>
        <StatusBadge status={toolCall.status} className="ml-auto" />
        <StatusIcon
          size={14}
          className={`shrink-0 ${
            toolCall.status === "calling"
              ? "animate-spin text-warning"
              : toolCall.status === "complete"
              ? "text-success"
              : "text-destructive"
          }`}
        />
        {expanded ? (
          <ChevronDown size={14} className="shrink-0 text-muted-foreground" />
        ) : (
          <ChevronRight size={14} className="shrink-0 text-muted-foreground" />
        )}
      </button>

      {expanded && (
        <div className="border-t border-border p-3 space-y-2">
          <div>
            <span className="ui-overline text-muted-foreground">Arguments</span>
            <pre className="mt-1 overflow-x-auto rounded-md bg-muted p-2 font-mono text-xs text-foreground">
              {JSON.stringify(toolCall.arguments, null, 2)}
            </pre>
          </div>
          {toolCall.result && (
            <div>
              <span className="ui-overline text-muted-foreground">Result</span>
              <p className="mt-1 font-body text-sm text-muted-foreground">
                {toolCall.result}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
