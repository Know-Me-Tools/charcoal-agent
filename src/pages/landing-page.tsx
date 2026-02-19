import { useState, useRef, useEffect, type KeyboardEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Bot, MessageSquare, Wrench, Zap, Send, ArrowRight } from "lucide-react";
import { useAgents } from "@/hooks/use-agents";
import { useCreateThread } from "@/hooks/use-threads";

const features = [
  {
    icon: Bot,
    title: "Intelligent Agents",
    description: "Configure AI agents with custom system prompts, provider policies, and attached skills.",
  },
  {
    icon: MessageSquare,
    title: "Persistent Threads",
    description: "Organize conversations into threads with full history and streaming responses.",
  },
  {
    icon: Wrench,
    title: "Extensible Skills",
    description: "Attach reusable capabilities to agents — from web search to code execution.",
  },
  {
    icon: Zap,
    title: "Real-time Streaming",
    description: "Watch agent responses stream in real time with tool call visualization.",
  },
];

export default function LandingPage() {
  const [message, setMessage] = useState("");
  const navigate = useNavigate();
  const { data: agents } = useAgents();
  const createThread = useCreateThread();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [message]);

  const handleSend = () => {
    const trimmed = message.trim();
    if (!trimmed) return;
    const agent = agents?.[0];
    if (agent) {
      createThread.mutate(
        { agent_id: agent.id, title: trimmed.slice(0, 60) },
        {
          onSuccess: (thread) => {
            navigate(`/threads/${thread.id}`, { state: { initialMessage: trimmed } });
          },
        },
      );
    } else {
      navigate("/threads");
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      handleSend();
    }
  };
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Hero */}
      <header className="flex items-center justify-between px-6 py-4 md:px-12">
        <span className="font-display text-lg font-bold tracking-tight text-foreground">
          KnowMe
        </span>
        <Link
          to="/threads"
          className="rounded-md bg-primary px-4 py-2 font-ui text-sm font-semibold text-primary-foreground transition-hover hover:bg-primary/90"
        >
          Open app
        </Link>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-6 text-center">
        <div className="mx-auto max-w-2xl">
          <p className="section-label mb-4">// Agent Runtime Interface</p>
          <h1 className="font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl" style={{ letterSpacing: "-0.04em" }}>
            Your AI agents,
            <br />
            <span className="text-primary">orchestrated.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-lg font-body text-base leading-relaxed text-muted-foreground sm:text-lg">
            A structured interface for managing and interacting with AI agents
            through persistent conversation threads.
          </p>
          <div className="mx-auto mt-10 w-full max-w-xl">
            <div className="rounded-xl border border-border bg-card p-3 shadow-lg shadow-background/50">
              <div className="flex items-end gap-2">
                <textarea
                  ref={textareaRef}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="What would you like to explore?"
                  rows={1}
                  className="max-h-[120px] min-h-[44px] flex-1 resize-none rounded-lg bg-background px-4 py-3 font-body text-[15px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                />
                <button
                  onClick={handleSend}
                  disabled={!message.trim() || createThread.isPending}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-hover hover:bg-primary/90 disabled:opacity-40"
                >
                  <Send size={18} />
                </button>
              </div>
              <div className="mt-2 flex items-center justify-between px-1">
                <span className="font-mono text-[10px] text-muted-foreground">
                  {"\u2318\u21B5"} to send
                </span>
                <Link
                  to="/threads"
                  className="flex items-center gap-1 font-ui text-[11px] font-semibold text-muted-foreground transition-hover hover:text-primary"
                >
                  Browse threads <ArrowRight size={10} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Features */}
      <section className="border-t border-border px-6 py-16 md:px-12">
        <div className="mx-auto grid max-w-4xl grid-cols-1 gap-8 sm:grid-cols-2">
          {features.map((f) => (
            <div key={f.title} className="rounded-lg border border-border bg-card p-6">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-md bg-primary/10">
                <f.icon size={20} className="text-primary" />
              </div>
              <h3 className="font-display text-base font-semibold text-foreground">
                {f.title}
              </h3>
              <p className="mt-2 font-body text-sm leading-relaxed text-muted-foreground">
                {f.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border px-6 py-6 text-center">
        <span className="font-mono text-[10px] text-muted-foreground">
          KnowMe · v0.1.0
        </span>
      </footer>
    </div>
  );
}
