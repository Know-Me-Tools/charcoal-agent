import type { FC } from "react";
import { BrainCircuitIcon, DatabaseIcon, PlusCircleIcon, Trash2Icon } from "lucide-react";
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
    <div className="my-2 overflow-hidden rounded-lg border border-border/50 bg-muted/10">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-border/30 px-3 py-2">
        <BrainCircuitIcon size={12} className="shrink-0 text-primary/70" />
        <span className="font-mono text-[11px] text-primary/70">
          {"// Memory recalled"}
        </span>
        <span className="ml-auto font-mono text-[10px] text-muted-foreground">
          {count} item{count !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Items */}
      <div className="divide-y divide-border/20 px-3 pb-2 pt-1.5">
        {items.map((item, i) => (
          <div key={`${item.key}-${i}`} className="py-1.5">
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-[11px] font-medium text-foreground/80">
                {item.key}
              </span>
              {item.scope && (
                <span className="rounded-sm bg-muted px-1 font-mono text-[9px] text-muted-foreground">
                  {item.scope}
                </span>
              )}
              {item.memoryType && (
                <span className="rounded-sm bg-primary/10 px-1 font-mono text-[9px] text-primary/60">
                  {item.memoryType}
                </span>
              )}
            </div>
            <p className="mt-0.5 font-body text-[12px] leading-snug text-muted-foreground">
              {item.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Memory Mutation Block ─────────────────────────────────────────────────────
// Shown when the agent creates, updates, or deletes a memory item.

const mutationConfig = {
  created: {
    Icon: PlusCircleIcon,
    label: "Memory stored",
    colorClass: "text-success-text",
    bgClass: "bg-success/10 border-success/20",
  },
  updated: {
    Icon: DatabaseIcon,
    label: "Memory updated",
    colorClass: "text-ember-text",
    bgClass: "bg-primary/10 border-primary/20",
  },
  deleted: {
    Icon: Trash2Icon,
    label: "Memory removed",
    colorClass: "text-danger-text",
    bgClass: "bg-destructive/10 border-destructive/20",
  },
} as const;

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
  const op = operation as keyof typeof mutationConfig;
  const cfg = mutationConfig[op] ?? mutationConfig.updated;
  const { Icon } = cfg;

  return (
    <div
      className={cn(
        "my-2 flex items-start gap-2 rounded-lg border px-3 py-2",
        cfg.bgClass,
      )}
    >
      <Icon size={12} className={cn("mt-0.5 shrink-0", cfg.colorClass)} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className={cn("font-mono text-[11px] font-medium", cfg.colorClass)}>
            {cfg.label}
          </span>
          {scope && (
            <span className="rounded-sm bg-muted/30 px-1 font-mono text-[9px] text-muted-foreground">
              {scope}
            </span>
          )}
          {memoryType && (
            <span className="rounded-sm bg-muted/30 px-1 font-mono text-[9px] text-muted-foreground">
              {memoryType}
            </span>
          )}
        </div>
        {content && (
          <p className="mt-0.5 line-clamp-2 font-body text-[12px] leading-snug text-muted-foreground">
            {content}
          </p>
        )}
      </div>
    </div>
  );
};
