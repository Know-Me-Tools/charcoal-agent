import { Link } from "react-router-dom";
import { Bot, MessageSquare, Wrench, Zap } from "lucide-react";

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
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              to="/threads"
              className="flex h-11 w-full items-center justify-center rounded-md bg-primary px-6 font-ui text-sm font-semibold text-primary-foreground transition-hover hover:bg-primary/90 sm:w-auto"
            >
              Start a thread
            </Link>
            <Link
              to="/agents"
              className="flex h-11 w-full items-center justify-center rounded-md border border-border px-6 font-ui text-sm font-semibold text-muted-foreground transition-hover hover:border-primary/30 hover:text-foreground sm:w-auto"
            >
              Manage agents
            </Link>
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
