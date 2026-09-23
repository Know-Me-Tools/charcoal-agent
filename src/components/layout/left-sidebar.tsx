import { MessageSquare, Plus, Search, Trash2, ChevronDown, Bot, UserCog } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { SectionLabel } from "@/components/common/section-label";
import { Button } from "@/components/ui/button";
import { UarStatus } from "@/components/common/uar-status";
import { useThreadRegistryStore } from "@/stores/thread-registry-store";
import { useChatMessageStore } from "@/stores/chat-message-store";
import { useAgents } from "@/hooks/use-agents";
import { useUi } from "@/hooks/use-ui";
import { api, isJwtConfigured } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import type { LocalThread } from "@/types";

interface LeftSidebarProps {
  className?: string;
}

// ── Agent selector dropdown for new thread creation ──────────────────────────

interface AgentSelectorProps {
  selectedId: string;
  selectedName: string;
  onChange: (id: string, name: string) => void;
}

function AgentSelector({ selectedId, selectedName, onChange }: AgentSelectorProps) {
  const { data: agents } = useAgents();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const displayName = selectedId ? selectedName : "Default agent";

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-6 w-full items-center justify-between gap-1 rounded border border-border bg-background px-2 font-ui text-[11px] text-muted-foreground hover:border-primary/30 hover:text-foreground"
      >
        <div className="flex min-w-0 items-center gap-1">
          <Bot size={11} className="shrink-0" />
          <span className="truncate">{displayName}</span>
        </div>
        <ChevronDown size={10} className="shrink-0" />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 rounded-md border border-border bg-card shadow-lg">
          {/* Default option */}
          <button
            type="button"
            onClick={() => { onChange("", "Default agent"); setOpen(false); }}
            className={cn(
              "w-full px-3 py-2 text-left font-ui text-[11px] hover:bg-muted",
              !selectedId && "text-primary font-semibold",
            )}
          >
            Default agent
          </button>

          {agents && agents.length > 0 && (
            <>
              <div className="border-t border-border" />
              {agents.map((agent) => (
                <button
                  key={agent.id}
                  type="button"
                  onClick={() => { onChange(agent.id, agent.name); setOpen(false); }}
                  className={cn(
                    "w-full px-3 py-2 text-left font-ui text-[11px] hover:bg-muted",
                    selectedId === agent.id && "text-primary font-semibold",
                  )}
                >
                  <span className="block truncate">{agent.name}</span>
                  {agent.source && (
                    <span className="font-mono text-[9px] text-muted-foreground capitalize">
                      {agent.source}
                    </span>
                  )}
                </button>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main sidebar ─────────────────────────────────────────────────────────────

export function LeftSidebar({ className }: LeftSidebarProps) {
  const [search, setSearch] = useState("");
  const [selectedAgentId, setSelectedAgentId] = useState("");
  const [selectedAgentName, setSelectedAgentName] = useState("Default agent");
  const [showAgentPicker, setShowAgentPicker] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const { setMobileSidebarOpen } = useUi();

  const threads = useThreadRegistryStore((s) => s.threads);
  const registerThread = useThreadRegistryStore((s) => s.registerThread);
  const removeThread = useThreadRegistryStore((s) => s.removeThread);

  const activeThreadId = (() => {
    const match = /\/threads\/([^/]+)/.exec(location.pathname);
    return match?.[1] ?? null;
  })();

  // Only show persisted (non-ephemeral) threads, sorted newest first
  const visibleThreads: LocalThread[] = Object.values(threads)
    .filter((t) => !t.isEphemeral)
    .filter((t) => t.title.toLowerCase().includes(search.toLowerCase()))
    .sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );

  const handleNewThread = () => {
    const id = crypto.randomUUID();
    registerThread(
      id,
      selectedAgentId || undefined,
      selectedAgentId ? selectedAgentName : undefined,
    );
    navigate(`/threads/${id}`);
    setMobileSidebarOpen(false);
    setShowAgentPicker(false);
  };

  const handleSelectThread = (thread: LocalThread) => {
    navigate(`/threads/${thread.id}`);
    setMobileSidebarOpen(false);
  };

  const handleDeleteThread = async (
    e: React.MouseEvent,
    id: string,
  ) => {
    e.stopPropagation();

    // Remove from local registry and message store immediately (optimistic)
    removeThread(id);
    useChatMessageStore.getState().clearThread(id);

    if (activeThreadId === id) {
      navigate("/threads");
    }

    // Best-effort server delete — ignore failures
    try {
      await api.delete(`/api/sessions/${id}`);
    } catch {
      // Server delete is fire-and-forget; local registry is source of truth
    }
  };

  const formatTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - d.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffDays === 0) {
        return d.toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
        });
      }
      if (diffDays < 7) {
        return d.toLocaleDateString("en-US", { weekday: "short" });
      }
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    } catch {
      return "";
    }
  };

  return (
    <aside className={`flex h-full flex-col bg-card ${className ?? ""}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-3">
        <SectionLabel>Threads</SectionLabel>
        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAgentPicker((v) => !v)}
            title="Choose agent for new thread"
            className={cn(
              "h-7 w-7 p-0 text-muted-foreground hover:text-foreground",
              showAgentPicker && "text-primary",
            )}
          >
            <Bot size={14} />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleNewThread}
            className="h-7 gap-1.5 px-2.5 font-ui text-xs font-semibold text-muted-foreground hover:border-primary hover:text-primary"
          >
            <Plus size={14} />
            New thread
          </Button>
        </div>
      </div>

      {/* Agent picker (shown when bot icon toggled) */}
      {showAgentPicker && (
        <div className="px-3 pb-2">
          <p className="mb-1 font-mono text-[10px] text-muted-foreground">
            Agent for new thread
          </p>
          <AgentSelector
            selectedId={selectedAgentId}
            selectedName={selectedAgentName}
            onChange={(id, name) => {
              setSelectedAgentId(id);
              setSelectedAgentName(name);
            }}
          />
        </div>
      )}

      {/* Search */}
      <div className="px-3 pb-2">
        <div className="flex items-center gap-2 rounded-md border border-border bg-background px-2.5 py-1.5">
          <Search size={14} className="text-muted-foreground" />
          <input
            type="text"
            placeholder="Search threads…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent font-ui text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-hidden"
          />
        </div>
      </div>

      {/* Thread list */}
      <div className="flex-1 overflow-y-auto px-1.5" style={{ minHeight: 0 }}>
        {visibleThreads.length === 0 ? (
          <div className="px-3 py-8 text-center">
            <p className="font-mono text-[11px] text-primary">
              {"// No threads yet"}
            </p>
            <p className="mt-1 font-body text-xs text-muted-foreground">
              Start a new thread to begin
            </p>
          </div>
        ) : (
          visibleThreads.map((thread) => (
            <div key={thread.id} className="group relative">
              <Button
                variant="ghost"
                onClick={() => handleSelectThread(thread)}
                className={cn(
                  "h-auto w-full justify-start gap-2 rounded-md px-2.5 py-2 pr-8",
                  activeThreadId === thread.id
                    ? "border-l-[3px] border-l-primary bg-accent hover:bg-accent"
                    : "hover:bg-muted/50",
                )}
              >
                <MessageSquare
                  size={14}
                  className="mt-0.5 shrink-0 text-muted-foreground"
                />
                <div className="min-w-0 flex-1 text-left">
                  <p className="truncate font-display text-[13px] font-semibold text-foreground">
                    {thread.title}
                  </p>
                  <div className="mt-0.5 flex items-center gap-2">
                    <span className="font-mono text-[10px] text-muted-foreground">
                      {formatTime(thread.updatedAt)}
                    </span>
                    {thread.agentName && (
                      <span className="flex items-center gap-0.5 font-mono text-[10px] text-primary/70">
                        <Bot size={9} />
                        {thread.agentName}
                      </span>
                    )}
                  </div>
                </div>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => void handleDeleteThread(e, thread.id)}
                className="absolute right-1 top-1/2 hidden size-5 -translate-y-1/2 text-muted-foreground hover:text-destructive group-hover:flex"
                aria-label={`Delete ${thread.title}`}
              >
                <Trash2 size={12} />
              </Button>
            </div>
          ))
        )}
      </div>

      {/* Footer: UAR status + account link (JWT only) */}
      <div className="border-t border-border px-1.5 py-1.5">
        <UarStatus />
        {isJwtConfigured() && (
          <button
            type="button"
            onClick={() => { navigate("/settings/account"); setMobileSidebarOpen(false); }}
            className="mt-1 flex w-full items-center gap-1.5 rounded-md px-2 py-1 font-mono text-[10px] text-muted-foreground hover:bg-muted/50 hover:text-foreground"
          >
            <UserCog size={11} />
            Account settings
          </button>
        )}
      </div>
    </aside>
  );
}
