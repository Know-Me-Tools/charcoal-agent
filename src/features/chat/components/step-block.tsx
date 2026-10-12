import { BanIcon, CheckIcon, TriangleAlertIcon } from "lucide-react";
import type { FC } from "react";
import { cn } from "@/lib/utils";
import { STEP_PHASES, type StepPhase } from "@/types/chat-content";

interface StepBlockProps {
  phase: StepPhase;
  /** Fixed server-side label; rendered as plain text, never as markup. */
  label: string;
}

/** State words live here; the label comes from the server. */
const STATE: Record<StepPhase, { word: string; visible: boolean }> = {
  started: { word: "in progress", visible: false },
  finished: { word: "done", visible: false },
  failed: { word: "did not complete", visible: true },
  denied: { word: "not permitted", visible: true },
};

/**
 * agui.step: one compact line per public step. The state is always in words
 * (screen-reader text for started/finished, visible for failed/denied), so
 * neither colour nor the pulse carries it. Informational: no controls, not
 * focusable. role="status" is a polite live region, and only this line's
 * text changes when a step settles.
 */
export const StepBlock: FC<StepBlockProps> = ({ phase, label }) => {
  if (!STEP_PHASES.includes(phase) || typeof label !== "string" || label === "") return null;
  const state = STATE[phase];

  return (
    <div
      role="status"
      className="my-1.5 flex min-w-0 items-center gap-2 rounded-lg bg-surface px-3 py-1.5 first:mt-0 last:mb-0"
    >
      <span className="flex size-3.5 shrink-0 items-center justify-center" aria-hidden="true">
        {phase === "started" && (
          <span
            data-step-mark
            className="size-1.5 animate-shimmer rounded-full bg-cyan motion-reduce:animate-none"
          />
        )}
        {phase === "finished" && <CheckIcon data-step-mark className="size-3.5 text-faint" />}
        {phase === "failed" && <TriangleAlertIcon data-step-mark className="size-3.5 text-warning-text" />}
        {phase === "denied" && <BanIcon data-step-mark className="size-3.5 text-fg-secondary" />}
      </span>
      <span
        className={cn(
          "min-w-0 font-ui text-xs wrap-break-word",
          phase === "started" ? "font-semibold text-cyan-text" : "text-fg-secondary",
        )}
      >
        {label}
      </span>
      <span
        className={cn(
          "font-ui text-xs",
          state.visible ? (phase === "failed" ? "text-warning-text" : "text-fg-secondary") : "sr-only",
        )}
      >
        {state.visible ? state.word : `, ${state.word}`}
      </span>
    </div>
  );
};
