import { BanIcon, CheckIcon, ChevronDownIcon, TriangleAlertIcon } from "lucide-react";
import type { FC } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
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
      className="my-1.5 flex min-w-0 max-w-[65ch] items-center gap-2 py-1.5 first:mt-0 last:mb-0"
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

interface StepGroupBlockProps {
  /** Finished steps, in order. */
  steps: ReadonlyArray<{ index: number; label: string }>;
}

/**
 * Finished steps folded into one line ("N steps") that expands to the rows.
 * Only finished steps are grouped, so nothing that needs attention hides here.
 */
export const StepGroupBlock: FC<StepGroupBlockProps> = ({ steps }) => {
  if (steps.length === 0) return null;
  return (
    <Collapsible className="my-1.5 min-w-0 max-w-[65ch] first:mt-0 last:mb-0">
      <CollapsibleTrigger className="group flex items-center gap-2 rounded-md py-1.5 font-ui text-xs text-fg-secondary transition-hover hover:bg-hover focus-cue">
        <CheckIcon className="size-3.5 text-faint" aria-hidden="true" />
        <span>{steps.length} steps</span>
        <ChevronDownIcon
          className="size-3.5 text-faint group-data-panel-open:rotate-180"
          aria-hidden="true"
        />
      </CollapsibleTrigger>
      <CollapsibleContent>
        {steps.map((s) => (
          <StepBlock key={s.index} phase="finished" label={s.label} />
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
};
