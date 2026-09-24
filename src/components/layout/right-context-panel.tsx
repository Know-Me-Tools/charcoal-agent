import { useParams } from "react-router-dom";
import { useThreadRegistryStore } from "@/stores/thread-registry-store";
import { useAgents } from "@/hooks/use-agents";
import { useUi } from "@/hooks/use-ui";
import { SectionLabel } from "@/components/common/section-label";
import { StatusBadge } from "@/components/common/status-badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Bot, Wrench, Brain, X } from "lucide-react";

/** Agent details for the open thread; shared by the inline panel and the sheet. */
function ContextPanelBody() {
  const { id } = useParams<{ id: string }>();

  // Read agentId directly from local registry — the UAR /api/sessions route
  // is disabled, so we never fetch from the server for thread metadata.
  const agentId = useThreadRegistryStore((s) => (id ? s.threads[id]?.agentId : undefined));
  const { data: agents } = useAgents();
  const activeAgent = agents?.find((a) => a.id === agentId);

  if (!activeAgent) {
    return (
      <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
        <Brain size={24} aria-hidden="true" className="mb-2 text-muted-foreground" />
        <p className="font-body text-sm text-muted-foreground">
          This thread uses the default agent. Choose an agent when you start a thread to see its model, skills and
          prompt here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4">
      <section>
        <SectionLabel>Active Agent</SectionLabel>
        <div className="mt-2 rounded-lg bg-raised p-3">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-md bg-ember-soft">
              <Bot size={16} aria-hidden="true" className="text-ember-text" />
            </div>
            <div className="min-w-0">
              <p className="truncate font-display text-sm font-semibold text-foreground">{activeAgent.name}</p>
              <p className="truncate font-mono text-xs text-faint">{activeAgent.model_id}</p>
            </div>
          </div>
          <div className="mt-2">
            <StatusBadge status={activeAgent.enabled ? "enabled" : "disabled"} />
          </div>
        </div>
      </section>

      {activeAgent.skills.length > 0 && (
        <section>
          <SectionLabel>Skills</SectionLabel>
          <ul className="mt-2 space-y-1">
            {activeAgent.skills.map((skill) => (
              <li key={skill} className="flex items-center gap-2 rounded-md px-2.5 py-1.5">
                <Wrench size={12} aria-hidden="true" className="text-muted-foreground" />
                <span className="font-mono text-xs text-foreground">{skill}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <SectionLabel>System Prompt</SectionLabel>
        <p className="mt-2 rounded-md bg-muted-surface p-3 font-body text-xs leading-relaxed text-muted-foreground">
          {activeAgent.system_prompt || "No system prompt configured."}
        </p>
      </section>
    </div>
  );
}

/** Inline context panel for wide screens (≥1280px). */
export function RightContextPanel() {
  const { rightPanelOpen, toggleRightPanel } = useUi();
  if (!rightPanelOpen) return null;

  return (
    <aside aria-label="Context" className="flex h-full w-[320px] shrink-0 flex-col bg-surface">
      <div className="flex items-center justify-between px-4 pt-3 pb-1">
        <SectionLabel>Context</SectionLabel>
        <button
          type="button"
          aria-label="Close context panel"
          onClick={toggleRightPanel}
          className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-hover hover:bg-hover hover:text-foreground focus-cue"
        >
          <X size={14} aria-hidden="true" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto">
        <ContextPanelBody />
      </div>
    </aside>
  );
}

/** The same panel as a right-hand sheet below 1280px, so it never squeezes the conversation. */
export function ContextPanelSheet() {
  const { contextSheetOpen, setContextSheetOpen } = useUi();

  return (
    <Sheet open={contextSheetOpen} onOpenChange={setContextSheetOpen}>
      <SheetContent side="right" closeLabel="Close context panel" className="w-[320px] bg-surface">
        <SheetHeader>
          <SheetTitle>Context</SheetTitle>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto">
          <ContextPanelBody />
        </div>
      </SheetContent>
    </Sheet>
  );
}
