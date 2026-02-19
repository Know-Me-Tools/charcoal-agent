import { useParams } from "react-router-dom";
import { useThreadDetail } from "@/hooks/use-threads";
import { useAgents } from "@/hooks/use-agents";
import { useUi } from "@/hooks/use-ui";
import { SectionLabel } from "@/components/common/section-label";
import { StatusBadge } from "@/components/common/status-badge";
import { Bot, Wrench, Brain, X } from "lucide-react";

export function RightContextPanel() {
  const { id } = useParams<{ id: string }>();
  const { data: thread } = useThreadDetail(id ?? null);
  const { data: agents } = useAgents();
  const { rightPanelOpen, toggleRightPanel } = useUi();

  if (!rightPanelOpen) return null;

  const activeAgent = agents?.find((a) => a.id === thread?.agent_id);

  return (
    <aside className="flex h-full w-[320px] shrink-0 flex-col border-l border-border bg-card">
      <div className="flex items-center justify-between border-b border-border p-3">
        <SectionLabel>Context</SectionLabel>
        <button
          onClick={toggleRightPanel}
          className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground transition-hover hover:text-foreground"
        >
          <X size={14} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {activeAgent ? (
          <>
            <div>
              <SectionLabel>Active Agent</SectionLabel>
              <div className="mt-2 rounded-lg border border-border p-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10">
                    <Bot size={16} className="text-primary" />
                  </div>
                  <div>
                    <p className="font-display text-sm font-semibold text-foreground">
                      {activeAgent.name}
                    </p>
                    <span className="font-mono text-[10px] text-muted-foreground">
                      {activeAgent.model_id}
                    </span>
                  </div>
                </div>
                <div className="mt-2">
                  <StatusBadge status={activeAgent.enabled ? "enabled" : "disabled"} />
                </div>
              </div>
            </div>

            {activeAgent.skills.length > 0 && (
              <div>
                <SectionLabel>Skills</SectionLabel>
                <div className="mt-2 space-y-1">
                  {activeAgent.skills.map((skill) => (
                    <div
                      key={skill}
                      className="flex items-center gap-2 rounded-md px-2.5 py-1.5"
                    >
                      <Wrench size={12} className="text-muted-foreground" />
                      <span className="font-mono text-xs text-foreground">{skill}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <SectionLabel>System Prompt</SectionLabel>
              <p className="mt-2 rounded-md bg-muted p-3 font-body text-xs leading-relaxed text-muted-foreground">
                {activeAgent.system_prompt || "No system prompt configured."}
              </p>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Brain size={24} className="mb-2 text-muted-foreground" />
            <p className="font-body text-sm text-muted-foreground">
              Select a thread to view agent details.
            </p>
          </div>
        )}
      </div>
    </aside>
  );
}
