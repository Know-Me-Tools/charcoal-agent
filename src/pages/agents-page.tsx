import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus, Bot, Brain, Loader2, ChevronDown, ChevronRight } from "lucide-react";
import { useAgents, useUpdateAgentMemory } from "@/hooks/use-agents";
import { SectionLabel } from "@/components/common/section-label";
import { StatusBadge } from "@/components/common/status-badge";
import { EmptyState } from "@/components/common/empty-state";
import { SkeletonCard } from "@/components/common/skeleton-loader";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Agent } from "@/types";

// ── Per-agent memory settings panel ─────────────────────────────────────────

type TriValue = "inherit" | "on" | "off";

function encodeTriValue(v: boolean | null | undefined): TriValue {
  if (v === null || v === undefined) return "inherit";
  return v ? "on" : "off";
}

function decodeTriValue(s: string): boolean | null {
  if (s === "on") return true;
  if (s === "off") return false;
  return null;
}

const SCOPE_OPTIONS = [
  { value: "agent", label: "Agent-scoped" },
  { value: "user", label: "User-scoped" },
  { value: "global", label: "Global" },
  { value: "session", label: "Session-scoped" },
];

function TriButton({
  value,
  onChange,
}: {
  value: TriValue;
  onChange: (v: TriValue) => void;
}) {
  const options: TriValue[] = ["inherit", "on", "off"];
  return (
    <div className="flex overflow-hidden rounded-md border border-border">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          className={`px-2 py-1 font-mono text-[11px] capitalize transition-colors ${
            value === opt
              ? "bg-primary text-primary-foreground"
              : "bg-background text-muted-foreground hover:bg-muted"
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

interface MemoryState {
  memory_enabled: boolean | null;
  auto_capture: boolean | null;
  inject_context: boolean | null;
  memory_scope: string;
}

function AgentMemoryPanel({ agent }: { agent: Agent }) {
  const [state, setState] = useState<MemoryState>({
    memory_enabled: null,
    auto_capture: null,
    inject_context: null,
    memory_scope: "agent",
  });
  const [saved, setSaved] = useState(false);
  const updateMemory = useUpdateAgentMemory();

  const handleSave = () => {
    updateMemory.mutate(
      {
        id: agent.id,
        memory_enabled: state.memory_enabled,
        memory_auto_capture: state.auto_capture,
        memory_inject_context: state.inject_context,
        memory_scope: state.memory_scope,
      },
      {
        onSuccess: () => {
          setSaved(true);
          setTimeout(() => setSaved(false), 2500);
        },
      },
    );
  };

  return (
    <div className="mt-3 rounded-lg border border-border bg-background p-3">
      <div className="mb-2 flex items-center gap-1.5">
        <Brain size={12} className="text-primary" />
        <span className="font-mono text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          Memory (per-agent override)
        </span>
      </div>

      <div className="space-y-2">
        {(
          [
            { key: "memory_enabled", label: "Memory" },
            { key: "auto_capture", label: "Auto-capture" },
            { key: "inject_context", label: "Context injection" },
          ] as const
        ).map(({ key, label }) => (
          <div key={key} className="flex items-center justify-between gap-2">
            <span className="font-mono text-[11px] text-foreground">{label}</span>
            <TriButton
              value={encodeTriValue(state[key])}
              onChange={(v) => setState((s) => ({ ...s, [key]: decodeTriValue(v) }))}
            />
          </div>
        ))}

        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-[11px] text-foreground">Scope</span>
          <Select
            value={state.memory_scope}
            items={SCOPE_OPTIONS}
            onValueChange={(v) => {
              if (v !== null) setState((s) => ({ ...s, memory_scope: v }));
            }}
          >
            <SelectTrigger className="h-7 w-36 font-mono text-[11px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SCOPE_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value} className="font-mono text-[11px]">
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={updateMemory.isPending}
          className="flex h-7 items-center gap-1.5 rounded-md bg-primary px-3 font-ui text-[12px] font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {updateMemory.isPending && <Loader2 size={11} className="animate-spin" />}
          Save
        </button>
        {saved && (
          <span className="font-mono text-[11px] text-green-400">Saved ✓</span>
        )}
        {updateMemory.isError && (
          <span className="font-mono text-[11px] text-destructive">
            {(updateMemory.error as Error).message}
          </span>
        )}
      </div>
    </div>
  );
}

// ── Agent card ───────────────────────────────────────────────────────────────

function AgentCard({ agent }: { agent: Agent }) {
  const [showMemory, setShowMemory] = useState(false);
  const navigate = useNavigate();

  const sourceBadgeClass =
    agent.source === "federated"
      ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
      : "bg-muted text-muted-foreground border-border";

  return (
    <div className="rounded-lg border border-border bg-card transition-colors hover:border-primary/20">
      {/* Clickable header — navigates to edit page */}
      <button
        type="button"
        onClick={() => navigate(`/agents/${agent.id}`)}
        className="w-full p-4 text-left"
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10">
              <Bot size={20} className="text-primary" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="truncate font-display text-sm font-semibold text-foreground group-hover:text-primary">
                  {agent.name}
                </span>
                <span
                  className={`rounded border px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider ${sourceBadgeClass}`}
                >
                  {agent.source ?? "runtime"}
                </span>
              </div>
              {agent.kind && (
                <span className="font-mono text-[10px] text-muted-foreground">
                  {agent.kind}
                </span>
              )}
            </div>
          </div>
          <StatusBadge status={agent.enabled ? "active" : "disabled"} />
        </div>

        {agent.metadata?.description && (
          <p className="mt-2 font-body text-xs text-muted-foreground line-clamp-2">
            {agent.metadata.description}
          </p>
        )}

        {agent.skills.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {agent.skills.slice(0, 3).map((skill) => (
              <span
                key={skill}
                className="rounded-sm bg-muted px-2 py-0.5 font-mono text-[10px] text-muted-foreground"
              >
                {skill}
              </span>
            ))}
            {agent.skills.length > 3 && (
              <span className="font-mono text-[10px] text-muted-foreground">
                +{agent.skills.length - 3}
              </span>
            )}
          </div>
        )}
      </button>

      {/* Memory settings — separate from navigation */}
      <div className="border-t border-border px-4 py-3">
        <button
          type="button"
          onClick={() => setShowMemory((v) => !v)}
          className="flex items-center gap-1 font-mono text-[10px] text-muted-foreground hover:text-foreground"
        >
          {showMemory ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
          Memory settings
        </button>
        {showMemory && <AgentMemoryPanel agent={agent} />}
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function AgentsPage() {
  const { data: agents, isLoading } = useAgents();

  const runtimeAgents = agents?.filter((a) => a.source !== "federated") ?? [];
  const federatedAgents = agents?.filter((a) => a.source === "federated") ?? [];

  return (
    <div className="flex flex-1 flex-col p-4 md:p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <SectionLabel>Agents</SectionLabel>
          <h1 className="mt-1 font-display text-xl font-bold text-foreground md:text-2xl">
            Agent Management
          </h1>
        </div>
        <Link
          to="/agents/new"
          className="flex h-9 items-center gap-2 rounded-md bg-primary px-3 font-ui text-sm font-semibold text-primary-foreground transition-hover hover:bg-primary/90 md:px-4"
        >
          <Plus size={16} />
          <span className="hidden sm:inline">Create agent</span>
        </Link>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {["skeleton-1", "skeleton-2", "skeleton-3"].map((id) => (
            <SkeletonCard key={id} />
          ))}
        </div>
      ) : !agents?.length ? (
        <EmptyState
          title="No agents available"
          description="Agents installed in the UAR will appear here."
        />
      ) : (
        <div className="space-y-8">
          {runtimeAgents.length > 0 && (
            <section>
              <p className="mb-3 font-mono text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                Runtime agents
              </p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {runtimeAgents.map((agent) => (
                  <AgentCard key={agent.id} agent={agent} />
                ))}
              </div>
            </section>
          )}

          {federatedAgents.length > 0 && (
            <section>
              <p className="mb-3 font-mono text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                Federated agents
              </p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {federatedAgents.map((agent) => (
                  <AgentCard key={agent.id} agent={agent} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
