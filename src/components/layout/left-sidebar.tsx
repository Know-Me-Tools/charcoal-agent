import { MessageSquare, Plus, Search, Trash2, Bot, UserCog } from "lucide-react";
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { SectionLabel } from "@/components/common/section-label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UarStatus } from "@/components/common/uar-status";
import { useThreadRegistryStore } from "@/stores/thread-registry-store";
import { useChatMessageStore } from "@/stores/chat-message-store";
import { useAgents } from "@/hooks/use-agents";
import { useUi } from "@/hooks/use-ui";
import { isSiteBuild } from "@/hooks/use-site-config";
import { isJwtConfigured } from "@/lib/api-client";
import { useDeleteSession } from "@/hooks/use-sessions";
import { cn } from "@/lib/utils";
import type { LocalThread } from "@/types";

interface LeftSidebarProps {
  className?: string;
}

// ── Agent selector for new thread creation ───────────────────────────────────

/** Select value for "no specific agent" (Base UI treats `null` as empty). */
const DEFAULT_AGENT = "default";

interface AgentSelectorProps {
  selectedId: string;
  onChange: (id: string, name: string) => void;
}

function AgentSelector({ selectedId, onChange }: AgentSelectorProps) {
  const { data: agents } = useAgents();
  const items = [
    { value: DEFAULT_AGENT, label: "Default agent" },
    ...(agents ?? []).map((agent) => ({ value: agent.id, label: agent.name })),
  ];

  return (
    <Select
      value={selectedId || DEFAULT_AGENT}
      items={items}
      onValueChange={(value) => {
        if (value === null) return;
        const item = items.find((i) => i.value === value);
        onChange(value === DEFAULT_AGENT ? "" : value, item?.label ?? "Default agent");
      }}
    >
      <SelectTrigger aria-label="Agent for new thread" size="sm" className="w-full font-ui text-xs">
        <Bot size={12} aria-hidden="true" className="text-muted-foreground" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {items.map((item) => (
          <SelectItem key={item.value} value={item.value} className="font-ui text-xs">
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

// ── Main sidebar ─────────────────────────────────────────────────────────────

export function LeftSidebar({ className }: LeftSidebarProps) {
  // Public site build: every thread is pinned server- and client-side to the
  // site agent (see use-message-stream.ts), so the picker that would let
  // someone choose a different agent is hidden entirely.
  const siteBuild = isSiteBuild();
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
  const deleteSession = useDeleteSession();

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

  const handleDeleteThread = (
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

    // Best-effort server delete; the local registry is the source of truth.
    deleteSession.mutate(id);
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
    <aside aria-label="Threads" className={cn("flex h-full flex-col bg-chrome", className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-3">
        <SectionLabel>Threads</SectionLabel>
        <div className="flex items-center gap-1.5">
          {!siteBuild && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAgentPicker((v) => !v)}
              aria-label="Choose agent for new thread"
              aria-pressed={showAgentPicker}
              title="Choose agent for new thread"
              className={cn(
                "size-7 p-0 text-muted-foreground hover:bg-hover hover:text-foreground",
                showAgentPicker && "bg-ember-soft text-ember-text",
              )}
            >
              <Bot size={14} aria-hidden="true" />
            </Button>
          )}
          <Button size="sm" onClick={handleNewThread} className="h-7 gap-1.5 px-2.5 font-ui text-xs font-semibold">
            <Plus size={14} aria-hidden="true" />
            New thread
          </Button>
        </div>
      </div>

      {/* Agent picker (shown when bot icon toggled) — never on the site build */}
      {!siteBuild && showAgentPicker && (
        <div className="px-3 pb-2">
          <AgentSelector
            selectedId={selectedAgentId}
            onChange={(id, name) => {
              setSelectedAgentId(id);
              setSelectedAgentName(name);
            }}
          />
        </div>
      )}

      {/* Search */}
      <div className="px-3 pb-2">
        <div className="flex items-center gap-2 rounded-md bg-muted-surface px-2.5 py-1.5 focus-within:bg-hover focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-ring">
          <Search size={14} aria-hidden="true" className="text-muted-foreground" />
          <input
            type="search"
            aria-label="Search threads"
            placeholder="Search threads…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent font-ui text-sm text-foreground outline-none placeholder:text-muted-foreground"
          />
        </div>
      </div>

      {/* Thread list */}
      <div className="flex-1 overflow-y-auto px-1.5" style={{ minHeight: 0 }}>
        {visibleThreads.length === 0 ? (
          <div className="px-3 py-8 text-center">
            <p className="font-mono text-xs text-ember-text">
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
                aria-current={activeThreadId === thread.id ? "page" : undefined}
                className={cn(
                  "h-auto w-full justify-start gap-2 rounded-md px-2.5 py-2 pr-9 focus-cue",
                  activeThreadId === thread.id ? "bg-ember-soft hover:bg-ember-soft" : "hover:bg-hover",
                )}
              >
                <MessageSquare
                  size={14}
                  aria-hidden="true"
                  className={cn(
                    "mt-0.5 shrink-0",
                    activeThreadId === thread.id ? "text-ember-text" : "text-muted-foreground",
                  )}
                />
                <div className="min-w-0 flex-1 text-left">
                  <p className="truncate font-display text-[13px] font-semibold text-foreground">
                    {thread.title}
                  </p>
                  <div className="mt-0.5 flex items-center gap-2">
                    <span className="font-mono text-xs text-faint">
                      {formatTime(thread.updatedAt)}
                    </span>
                    {thread.agentName && (
                      <span className="flex min-w-0 items-center gap-1 truncate font-mono text-xs text-faint">
                        <Bot size={11} aria-hidden="true" />
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
                className="absolute top-1/2 right-1 size-7 -translate-y-1/2 text-muted-foreground opacity-0 group-focus-within:opacity-100 group-hover:opacity-100 hover:bg-danger-soft hover:text-danger-text focus-visible:opacity-100"
                aria-label={`Delete ${thread.title}`}
              >
                <Trash2 size={13} aria-hidden="true" />
              </Button>
            </div>
          ))
        )}
      </div>

      {/* Footer: UAR status + account link (JWT only, never on the site build — /settings is hidden there) */}
      <div className="px-1.5 pt-2 pb-1.5">
        <UarStatus />
        {!siteBuild && isJwtConfigured() && (
          <button
            type="button"
            onClick={() => { navigate("/settings/account"); setMobileSidebarOpen(false); }}
            className="mt-1 flex w-full items-center gap-1.5 rounded-md px-2.5 py-1.5 font-ui text-xs text-muted-foreground transition-hover hover:bg-hover hover:text-foreground focus-cue"
          >
            <UserCog size={13} aria-hidden="true" />
            Account settings
          </button>
        )}
      </div>
    </aside>
  );
}
