import type { FC } from "react";
import { BrainCircuitIcon, DatabaseIcon, PlusCircleIcon, Trash2Icon, type LucideIcon } from "lucide-react";
import type { MemoryItem } from "@/types/chat-content";
import { cn } from "@/lib/utils";

// ─── Memory Recall Block ───────────────────────────────────────────────────────
// Shown when the UAR injects remembered items into the context before a response.

interface MemoryRecallBlockProps {
  items: MemoryItem[];
  count: number;
}

export const MemoryRecallBlock: FC<MemoryRecallBlockProps> = ({ items, count }) => {
  if (!items.length) return null;

  return (
    <div className="my-3 min-w-0 overflow-hidden rounded-lg bg-surface first:mt-0 last:mb-0">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 px-3 pt-2.5 pb-2">
        <BrainCircuitIcon className="size-3.5 shrink-0 text-fg-secondary" aria-hidden="true" />
        <span className="font-ui text-xs font-semibold text-fg">Memory recalled</span>
        <span className="ms-auto font-mono text-xs text-faint">
          {count} item{count !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Items */}
      <ul className="space-y-1.5 px-3 pb-3">
        {items.map((item, i) => (
          <li key={`${item.key}-${i}`} className="rounded-md bg-raised px-2.5 py-2">
            <div className="flex min-w-0 flex-wrap items-center gap-1.5">
              <span className="min-w-0 font-mono text-xs font-semibold text-fg wrap-anywhere">
                {item.key}
              </span>
              {item.scope && (
                <span className="inline-flex shrink-0 items-center rounded-pill bg-muted-surface px-2 py-0.5 font-mono text-xs text-fg-secondary">
                  {item.scope}
                </span>
              )}
              {item.memoryType && (
                <span className="inline-flex shrink-0 items-center rounded-pill bg-muted-surface px-2 py-0.5 font-mono text-xs text-fg-secondary">
                  {item.memoryType}
                </span>
              )}
            </div>
            <p className="mt-1 font-body text-sm leading-snug text-fg-secondary wrap-break-word">
              {item.value}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
};

// ─── Memory Mutation Block ─────────────────────────────────────────────────────
// Shown when the agent creates, updates, or deletes a memory item. The operation
// is carried entirely by the status pill (icon + text label; design spec §5, §7.4).

const mutationConfig: Record<
  string,
  { Icon: LucideIcon; label: string; fillClass: string; toneClass: string }
> = {
  created: {
    Icon: PlusCircleIcon,
    label: "Stored",
    fillClass: "bg-success-soft",
    toneClass: "text-success-text",
  },
  updated: {
    Icon: DatabaseIcon,
    label: "Updated",
    fillClass: "bg-muted-surface",
    toneClass: "text-fg-secondary",
  },
  deleted: {
    Icon: Trash2Icon,
    label: "Removed",
    fillClass: "bg-danger-soft",
    toneClass: "text-danger-text",
  },
};

interface MemoryMutationBlockProps {
  operation: string;
  memoryId: string;
  content: string;
  scope: string;
  memoryType: string;
}

export const MemoryMutationBlock: FC<MemoryMutationBlockProps> = ({
  operation,
  content,
  scope,
  memoryType,
}) => {
  const cfg = mutationConfig[operation] ?? mutationConfig.updated;
  const { Icon } = cfg;

  return (
    <div className="my-3 flex min-w-0 items-start gap-2 rounded-lg bg-surface px-3 py-2 first:mt-0 last:mb-0">
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 flex-wrap items-center gap-1.5">
          <span
            className={cn(
              "inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-pill px-2.5 py-1 font-ui text-xs font-semibold leading-none",
              cfg.fillClass,
              cfg.toneClass,
            )}
          >
            <Icon className="size-3.5 shrink-0" aria-hidden="true" />
            <span>{cfg.label}</span>
          </span>
          {scope && (
            <span className="inline-flex shrink-0 items-center rounded-pill bg-muted-surface px-2 py-0.5 font-mono text-xs text-fg-secondary">
              {scope}
            </span>
          )}
          {memoryType && (
            <span className="inline-flex shrink-0 items-center rounded-pill bg-muted-surface px-2 py-0.5 font-mono text-xs text-fg-secondary">
              {memoryType}
            </span>
          )}
        </div>
        {content && (
          <p className="mt-1 line-clamp-3 font-body text-sm leading-snug text-fg-secondary wrap-break-word">
            {content}
          </p>
        )}
      </div>
    </div>
  );
};
