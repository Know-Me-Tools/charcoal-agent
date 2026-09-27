import { DatabaseZapIcon } from "lucide-react";
import type { FC } from "react";

// Human-readable labels for the strategies documented in API_CHAT_COMPLETION.md
const STRATEGY_LABELS: Record<string, string> = {
  sliding_window: "Sliding window",
  progressive_summarization: "Progressive summarization",
  hierarchical_memory: "Hierarchical memory",
  keep_first_last: "Keep first + last",
  none: "No-op",
};

interface ContextUpdateBlockProps {
  strategy: string;
  messagesRemoved: number;
  tokensSaved: number;
  wasApplied: boolean;
  summaryGenerated: boolean;
}

export const ContextUpdateBlock: FC<ContextUpdateBlockProps> = ({
  strategy,
  messagesRemoved,
  tokensSaved,
  summaryGenerated,
}) => {
  const strategyLabel = STRATEGY_LABELS[strategy] ?? strategy;

  // Every fact renders identically (font-mono text-xs text-faint); facts are
  // separated by the flex gap, not "·" characters (design spec §7.6).
  const facts: string[] = [strategyLabel];
  if (messagesRemoved > 0) {
    facts.push(`${messagesRemoved} message${messagesRemoved !== 1 ? "s" : ""} compacted`);
  }
  if (tokensSaved > 0) {
    facts.push(`~${tokensSaved.toLocaleString()} tokens freed`);
  }
  if (summaryGenerated) {
    facts.push("summary saved");
  }

  return (
    <div className="my-3 flex min-w-0 items-start gap-2 rounded-lg bg-surface px-3 py-2 first:mt-0 last:mb-0">
      <DatabaseZapIcon className="mt-0.5 size-3.5 shrink-0 text-fg-secondary" aria-hidden="true" />

      <div className="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-2 gap-y-1">
        <span className="font-ui text-xs font-semibold text-fg-secondary">Context managed</span>
        {facts.map((fact, i) => (
          <span key={`fact-${i}`} className="font-mono text-xs text-faint wrap-break-word">
            {fact}
          </span>
        ))}
      </div>
    </div>
  );
};
