import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search, MessageSquare, Trash2 } from "lucide-react";
import { useThreads, useActiveThread, useDeleteThread, useCreateThread } from "@/hooks/use-threads";
import { useAgents } from "@/hooks/use-agents";
import { useUi } from "@/hooks/use-ui";
import { SectionLabel } from "@/components/common/section-label";
import { SkeletonLine } from "@/components/common/skeleton-loader";
import type { Thread } from "@/types";

interface LeftSidebarProps {
  className?: string;
}

export function LeftSidebar({ className }: LeftSidebarProps) {
  const [search, setSearch] = useState("");
  const { data: threads, isLoading } = useThreads();
  const { data: agents } = useAgents();
  const { activeThreadId, setActiveThread } = useActiveThread();
  const deleteThread = useDeleteThread();
  const createThread = useCreateThread();
  const navigate = useNavigate();
  const { setMobileSidebarOpen } = useUi();

  const filteredThreads = (threads ?? []).filter((t) =>
    t.title.toLowerCase().includes(search.toLowerCase()),
  );

  const handleNewThread = () => {
    const firstAgent = agents?.[0];
    if (firstAgent) {
      createThread.mutate(
        { agent_id: firstAgent.id, title: "New thread" },
        {
          onSuccess: (thread) => {
            navigate(`/threads/${thread.id}`);
            setMobileSidebarOpen(false);
          },
        },
      );
    }
  };

  const handleSelectThread = (thread: Thread) => {
    setActiveThread(thread.id);
    navigate(`/threads/${thread.id}`);
    setMobileSidebarOpen(false);
  };

  const handleDeleteThread = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    deleteThread.mutate(id);
    if (activeThreadId === id) {
      setActiveThread(null);
      navigate("/threads");
    }
  };

  const formatTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    } catch {
      return "";
    }
  };

  return (
    <aside className={`flex h-full flex-col bg-card ${className ?? ""}`}>
      <div className="flex items-center justify-between p-3">
        <SectionLabel>Threads</SectionLabel>
        <button
          onClick={handleNewThread}
          className="flex h-7 items-center gap-1.5 rounded-md border border-border px-2.5 font-ui text-xs font-semibold text-muted-foreground transition-hover hover:border-primary hover:text-primary"
        >
          <Plus size={14} />
          New thread
        </button>
      </div>

      <div className="px-3 pb-2">
        <div className="flex items-center gap-2 rounded-md border border-border bg-background px-2.5 py-1.5">
          <Search size={14} className="text-muted-foreground" />
          <input
            type="text"
            placeholder="Search threads..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent font-ui text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-1.5">
        {isLoading ? (
          <div className="space-y-2 p-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="space-y-1.5 rounded-md p-2">
                <SkeletonLine width="w-3/4" />
                <SkeletonLine width="w-1/3" />
              </div>
            ))}
          </div>
        ) : filteredThreads.length === 0 ? (
          <div className="px-3 py-8 text-center font-body text-sm text-muted-foreground">
            No threads yet. Create one to begin.
          </div>
        ) : (
          filteredThreads.map((thread) => (
            <button
              key={thread.id}
              onClick={() => handleSelectThread(thread)}
              className={`group flex w-full items-start gap-2 rounded-md px-2.5 py-2 text-left transition-hover ${
                activeThreadId === thread.id
                  ? "border-l-[3px] border-l-primary bg-accent"
                  : "hover:bg-muted/50"
              }`}
            >
              <MessageSquare
                size={14}
                className="mt-0.5 shrink-0 text-muted-foreground"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate font-display text-[13px] font-semibold text-foreground">
                  {thread.title}
                </p>
                <div className="mt-0.5 flex items-center gap-2">
                  <span className="mono-meta">{formatTime(thread.updated_at)}</span>
                  {thread.agent_name && (
                    <span className="rounded-sm bg-muted px-1.5 py-0.5 font-mono text-[9px] text-muted-foreground">
                      {thread.agent_name}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={(e) => handleDeleteThread(e, thread.id)}
                className="mt-0.5 hidden shrink-0 rounded p-0.5 text-muted-foreground transition-hover hover:text-destructive group-hover:block"
              >
                <Trash2 size={12} />
              </button>
            </button>
          ))
        )}
      </div>
    </aside>
  );
}
