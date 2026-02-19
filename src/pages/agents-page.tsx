import { Link, useNavigate } from "react-router-dom";
import { Plus, Bot } from "lucide-react";
import { useAgents, useDeleteAgent } from "@/hooks/use-agents";
import { SectionLabel } from "@/components/common/section-label";
import { StatusBadge } from "@/components/common/status-badge";
import { EmptyState } from "@/components/common/empty-state";
import { SkeletonCard } from "@/components/common/skeleton-loader";

export default function AgentsPage() {
  const { data: agents, isLoading } = useAgents();
  const deleteAgent = useDeleteAgent();
  const navigate = useNavigate();

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
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : !agents?.length ? (
        <EmptyState
          title="No agents configured"
          description="Create your first agent to get started."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {agents.map((agent) => (
            <Link
              key={agent.id}
              to={`/agents/${agent.id}`}
              className="group rounded-lg border border-border bg-card p-4 transition-hover hover:border-primary/30"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10">
                    <Bot size={20} className="text-primary" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="truncate font-display text-sm font-semibold text-foreground">
                      {agent.name}
                    </h4>
                    <div className="mt-0.5 flex items-center gap-2">
                      <span className="truncate font-mono text-[10px] text-muted-foreground">
                        {agent.model_id}
                      </span>
                    </div>
                  </div>
                </div>
                <StatusBadge status={agent.enabled ? "active" : "disabled"} />
              </div>
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
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
