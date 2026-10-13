/**
 * Reserved tool names for blocks stored as tool-call blocks (the existing
 * store actions have no other slot for them) and rendered by their own
 * renderer in `tool-call-part.tsx`, like the `__skill__`/`__context__`
 * encodings in `use-chat-runtime.ts`.
 */
export const CANCELLED_PART = "__cancelled__";
export const SUBAGENT_PART = "__subagent__";
export const APPROVAL_PART = "__approval__";
export const STEP_PART = "__step__";

/**
 * Not stored: `richMessageToThreadMessageLike` folds each run of consecutive
 * citation blocks into one part with this name, rendered as one Sources list.
 */
export const CITATIONS_PART = "__citations__";

/**
 * Not stored: a run of two or more finished steps folds into one collapsed
 * line (site-chat-hardening-and-polish, finding P1-6). Running, failed and
 * denied steps are never folded.
 */
export const STEP_GROUP_PART = "__step_group__";

/** The slice of an assistant-ui part that `arrangeAssistantParts` reads. */
export interface ArrangeablePart {
  type: string;
  toolCallId?: string;
  toolName?: string;
  text?: string;
  // pseudo-part args are per-part shapes
  args?: any; // eslint-disable-line @typescript-eslint/no-explicit-any
}

function foldFinishedSteps<T extends ArrangeablePart>(parts: readonly T[]): T[] {
  const out: T[] = [];
  let run: T[] = [];
  const flush = () => {
    if (run.length >= 2) {
      out.push({
        type: "tool-call",
        toolCallId: `step-group-${run[0].args?.index}`,
        toolName: STEP_GROUP_PART,
        args: { steps: run.map((p) => ({ index: p.args?.index, label: p.args?.label })) },
      } as unknown as T);
    } else {
      out.push(...run);
    }
    run = [];
  };
  for (const part of parts) {
    if (part.toolName === STEP_PART && part.args?.phase === "finished") {
      run.push(part);
      continue;
    }
    flush();
    out.push(part);
  }
  flush();
  return out;
}

function placeCitationsAfterProse<T extends ArrangeablePart>(parts: readonly T[], streaming: boolean): T[] {
  const citationParts = parts.filter((p) => p.toolName === CITATIONS_PART);
  if (citationParts.length === 0) return [...parts];

  const merged = {
    ...citationParts[0],
    args: {
      citations: citationParts.flatMap((p) => p.args?.citations ?? []),
      streaming,
    },
  } as T;

  const rest = parts.filter((p) => p.toolName !== CITATIONS_PART);
  let lastText = -1;
  rest.forEach((p, i) => {
    if (p.type === "text" && (p.text ?? "") !== "") lastText = i;
  });
  if (lastText === -1) {
    // No prose yet: keep the block where the first citation arrived.
    const at = parts.indexOf(citationParts[0]);
    return [...rest.slice(0, at), merged, ...rest.slice(at)];
  }
  return [...rest.slice(0, lastText + 1), merged, ...rest.slice(lastText + 1)];
}

/**
 * Final layout of an assistant message's parts: one Sources block after the
 * prose (P1-1) and finished steps folded into one line (P1-6). While the
 * message streams the Sources block renders as a single status line.
 */
export function arrangeAssistantParts<T extends ArrangeablePart>(parts: readonly T[], streaming: boolean): T[] {
  return placeCitationsAfterProse(foldFinishedSteps(parts), streaming);
}

/** Same shape as UAR's `agui.done` usage (UAR PR #361). */
export interface CancelledUsage {
  input_tokens?: number;
  output_tokens?: number;
  total_tokens?: number;
}

export type SubagentStatus = "running" | "complete" | "failed" | "cancelled";
