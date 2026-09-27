import { CheckCircle2Icon, Loader2Icon, ZapIcon } from "lucide-react";
import type { FC } from "react";
import { cn } from "@/lib/utils";

// Human-readable labels for the selection methods documented in API_CHAT_COMPLETION.md
const METHOD_LABELS: Record<string, string> = {
  "skill_service.keyword": "keyword",
  "skill_service.embedding": "embedding",
  "skill_service.local_embedding": "local embedding",
  "skill_service.llm": "LLM",
  "skill_service.hybrid": "hybrid",
  "legacy_classifier.rules": "rules",
  "legacy_classifier.tfidf": "TF-IDF",
  "legacy_classifier.wasm": "WASM",
  "legacy_classifier.local_embedding": "local embedding",
  "legacy_classifier.llm": "LLM",
  "legacy_classifier.hybrid": "hybrid",
  "legacy_fallback.tag_vector_hybrid": "tag+vector",
};

interface SkillActivationBlockProps {
  skillId: string;
  skillName: string;
  selectionMethod?: string;
  status: "active" | "complete";
}

export const SkillActivationBlock: FC<SkillActivationBlockProps> = ({
  skillName,
  selectionMethod,
  status,
}) => {
  const isActive = status === "active";
  const methodLabel = selectionMethod
    ? (METHOD_LABELS[selectionMethod] ?? selectionMethod)
    : null;

  return (
    <div className="my-3 flex min-w-0 items-start gap-2 rounded-lg bg-surface px-3 py-2 first:mt-0 last:mb-0">
      <ZapIcon className="mt-0.5 size-3.5 shrink-0 text-fg-secondary" aria-hidden="true" />

      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-1">
        {/* Skill name — wraps rather than truncating */}
        <span className="min-w-0 font-mono text-xs font-semibold text-fg wrap-anywhere">
          {skillName}
        </span>

        {/* Selection method metadata pill */}
        {methodLabel && (
          <span className="inline-flex shrink-0 items-center rounded-pill bg-muted-surface px-2 py-0.5 font-mono text-xs text-fg-secondary">
            {methodLabel}
          </span>
        )}

        {/* Status pill — right aligned */}
        <span
          className={cn(
            "ms-auto inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-pill px-2.5 py-1 font-ui text-xs font-semibold leading-none",
            isActive ? "bg-cyan-soft text-cyan-text" : "bg-success-soft text-success-text",
          )}
        >
          {isActive ? (
            <Loader2Icon className="size-3.5 shrink-0 animate-spin" aria-hidden="true" />
          ) : (
            <CheckCircle2Icon className="size-3.5 shrink-0" aria-hidden="true" />
          )}
          <span>{isActive ? "Running" : "Completed"}</span>
        </span>
      </div>
    </div>
  );
};
