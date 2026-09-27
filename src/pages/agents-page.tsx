import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus, Bot, Brain, Check, Loader2, ChevronDown, ChevronRight } from "lucide-react";
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
    <div className="flex gap-0.5 rounded-md bg-muted-surface p-0.5">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          aria-pressed={value === opt}
          className={`rounded-[min(var(--radius-md),8px)] px-2 py-1 font-mono text-xs capitalize transition-colors focus-cue ${
            value === opt
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-hover"
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
    <div className="mt-3 rounded-lg bg-raised p-3">
      <div className="mb-2 flex items-center gap-1.5">
        <Brain size={12} className="text-ember-text" />
        <span className="font-mono text-xs font-semibold uppercase tracking-widest text-muted-foreground">
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
            <span className="font-mono text-xs text-foreground">{label}</span>
            <TriButton
              value={encodeTriValue(state[key])}
              onChange={(v) => setState((s) => ({ ...s, [key]: decodeTriValue(v) }))}
            />
          </div>
        ))}

        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-xs text-foreground">Scope</span>
          <Select
            value={state.memory_scope}
            items={SCOPE_OPTIONS}
            onValueChange={(v) => {
              if (v !== null) setState((s) => ({ ...s, memory_scope: v }));
            }}
          >
            <SelectTrigger className="h-7 w-36 font-mono text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SCOPE_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value} className="font-mono text-xs">
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
          className="flex h-7 items-center gap-1.5 rounded-md bg-primary px-3 font-ui text-xs font-semibold text-primary-foreground hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:opacity-50"
        >
          {updateMemory.isPending && <Loader2 size={11} className="animate-spin" />}
          Save
        </button>
        {saved && (
          <span className="inline-flex items-center gap-1 font-mono text-xs text-success-text">
            <Check size={12} /> Saved
          </span>
        )}
        {updateMemory.isError && (
          <span className="font-mono text-xs text-danger-text">
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

  const sourceLabel = agent.source === "federated" ? "federated" : (agent.source ?? "runtime");

  return (
    <div className="rounded-lg bg-band transition-colors">
      {/* Clickable header — navigates to edit page */}
      <button
        type="button"
        onClick={() => navigate(`/agents/${agent.id}`)}
        className="w-full rounded-lg p-4 text-left focus-cue"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10">
              <Bot size={20} className="text-ember-text" />
            </div>
            <div className="min-w-0">
              <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5">
                <span className="max-w-full truncate font-display text-sm font-semibold text-foreground">
                  {agent.name}
                </span>
                <span className="shrink-0 font-mono text-xs uppercase tracking-wider text-fg-secondary">
                  {sourceLabel}
                </span>
              </div>
              {agent.kind && (
                <span className="font-mono text-xs text-muted-foreground">
                  {agent.kind}
                </span>
              )}
            </div>
          </div>
          <StatusBadge status={agent.enabled ? "active" : "disabled"} className="shrink-0" />
        </div>

        {agent.metadata?.description && (
          <p className="mt-2 font-body text-xs text-muted-foreground line-clamp-2">
            {agent.metadata.description}
          </p>
        )}

        {agent.skills.length > 0 && (
          // These tags sit on the card's `bg-band` fill, so they use `bg-surface`
          // rather than `bg-muted-surface`, which resolves to the same colour as
          // `bg-band` in light.
          <div className="mt-3 flex flex-wrap gap-1">
            {agent.skills.slice(0, 3).map((skill) => (
              <span
                key={skill}
                className="rounded-sm bg-raised px-2 py-0.5 font-mono text-xs text-muted-foreground"
              >
                {skill}
              </span>
            ))}
            {agent.skills.length > 3 && (
              <span className="font-mono text-xs text-muted-foreground">
                +{agent.skills.length - 3}
              </span>
            )}
          </div>
        )}
      </button>

      {/* Memory settings — separate from navigation */}
      <div className="px-4 py-3">
        <button
          type="button"
          onClick={() => setShowMemory((v) => !v)}
          aria-expanded={showMemory}
          className="flex items-center gap-1 rounded-md font-mono text-xs text-muted-foreground hover:text-foreground focus-cue"
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
          className="flex h-9 items-center gap-2 rounded-md bg-primary px-3 font-ui text-sm font-semibold text-primary-foreground transition-hover hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring md:px-4"
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
              <p className="mb-3 font-mono text-xs font-semibold uppercase tracking-widest text-muted-foreground">
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
              <p className="mb-3 font-mono text-xs font-semibold uppercase tracking-widest text-muted-foreground">
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
