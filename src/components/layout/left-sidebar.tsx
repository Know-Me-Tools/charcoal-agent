import { MessageSquare, Plus, Search, Trash2 } from "lucide-react";
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { SectionLabel } from "@/components/common/section-label";
import { Button } from "@/components/ui/button";
import { useThreadRegistryStore } from "@/stores/thread-registry-store";
import { useChatMessageStore } from "@/stores/chat-message-store";
import { useUi } from "@/hooks/use-ui";
import { api } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import type { LocalThread } from "@/types";

interface LeftSidebarProps {
  className?: string;
}

export function LeftSidebar({ className }: LeftSidebarProps) {
  const [search, setSearch] = useState("");
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
    registerThread(id);
    navigate(`/threads/${id}`);
    setMobileSidebarOpen(false);
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

      {/* Search */}
      <div className="px-3 pb-2">
        <div className="flex items-center gap-2 rounded-md border border-border bg-background px-2.5 py-1.5">
          <Search size={14} className="text-muted-foreground" />
          <input
            type="text"
            placeholder="Search threads…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent font-ui text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
        </div>
      </div>

      {/* Thread list */}
      <div className="flex-1 overflow-y-auto px-1.5">
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
    </aside>
  );
}
