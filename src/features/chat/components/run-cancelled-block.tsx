import { CircleSlashIcon } from "lucide-react";
import type { FC } from "react";

interface RunCancelledBlockProps {
  /** Token counts reported before the cancel (UAR PR #361); absent on older builds. */
  usage?: { input_tokens?: number; output_tokens?: number; total_tokens?: number };
}

const tokens = (n: number, label: string) => `${n.toLocaleString()} ${label} token${n !== 1 ? "s" : ""}`;

/** agui.cancelled: the run stopped before it finished. Same row anatomy as ContextUpdateBlock. */
export const RunCancelledBlock: FC<RunCancelledBlockProps> = ({ usage }) => {
  const facts: string[] = [];
  if (typeof usage?.input_tokens === "number") facts.push(tokens(usage.input_tokens, "input"));
  if (typeof usage?.output_tokens === "number") facts.push(tokens(usage.output_tokens, "output"));
  if (facts.length === 0 && typeof usage?.total_tokens === "number") {
    facts.push(tokens(usage.total_tokens, "total"));
  }

  return (
    <div
      role="status"
      className="my-3 flex min-w-0 items-start gap-2 rounded-lg bg-surface px-3 py-2 first:mt-0 last:mb-0"
    >
      <CircleSlashIcon className="mt-0.5 size-3.5 shrink-0 text-fg-secondary" aria-hidden="true" />
      <div className="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-2 gap-y-1">
        <span className="font-ui text-xs font-semibold text-fg-secondary">Run cancelled</span>
        {facts.map((fact) => (
          <span key={fact} className="font-mono text-xs text-faint wrap-break-word">
            {fact}
          </span>
        ))}
      </div>
    </div>
  );
};
