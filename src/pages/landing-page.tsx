import {
	ArrowRight,
	Bot,
	MessageSquare,
	Moon,
	Send,
	Sun,
	Wrench,
	Zap,
} from "lucide-react";
import { type KeyboardEvent, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useChatIntentStore } from "@/stores/chat-intent-store";
import { useThreadRegistryStore } from "@/stores/thread-registry-store";
import { useUi } from "@/hooks/use-ui";

const features = [
	{
		icon: Bot,
		title: "Intelligent Agents",
		description:
			"Configure AI agents with custom system prompts, provider policies, and attached skills.",
	},
	{
		icon: MessageSquare,
		title: "Persistent Threads",
		description:
			"Organize conversations into threads with full history and streaming responses.",
	},
	{
		icon: Wrench,
		title: "Extensible Skills",
		description:
			"Attach reusable capabilities to agents — from web search to code execution.",
	},
	{
		icon: Zap,
		title: "Real-time Streaming",
		description:
			"Watch agent responses stream in real time with tool call visualization.",
	},
];

export default function LandingPage() {
	const [message, setMessage] = useState("");
	const navigate = useNavigate();
	const { theme, setTheme } = useUi();
	const setPendingPrompt = useChatIntentStore((s) => s.setPendingPrompt);
	const registerThread = useThreadRegistryStore((s) => s.registerThread);
	const textareaRef = useRef<HTMLTextAreaElement>(null);

	// biome-ignore lint/correctness/useExhaustiveDependencies: message change drives textarea height recalculation
	useEffect(() => {
		if (textareaRef.current) {
			textareaRef.current.style.height = "auto";
			textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
		}
	}, [message]);

	const handleSend = () => {
		const trimmed = message.trim();
		if (!trimmed) return;

		// Register the thread in the local registry as ephemeral before navigating.
		// It will be promoted to persisted once the first message reply arrives.
		const sessionId = crypto.randomUUID();
		registerThread(sessionId);

		// Write the prompt to the intent store BEFORE navigating so the thread
		// page can read it synchronously on first render without any race.
		setPendingPrompt(trimmed);
		navigate(`/threads/${sessionId}`);
	};

	const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
		if (e.key === "Enter" && !e.shiftKey) {
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
				<div className="flex items-center gap-2">
					<button
						onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
						className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-hover hover:bg-muted hover:text-foreground"
						title="Toggle theme"
					>
						{theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
					</button>
					<Link
						to="/threads"
						className="rounded-md bg-primary px-4 py-2 font-ui text-sm font-semibold text-primary-foreground transition-hover hover:bg-primary/90"
					>
						Open app
					</Link>
				</div>
			</header>

			<main className="flex flex-1 flex-col items-center justify-center px-6 pb-16 text-center">
				<div className="mx-auto max-w-2xl">
					<p className="section-label mb-4">{"// An OS that learns you"}</p>
					<h1 className="font-display text-4xl font-bold text-foreground tracking-[-0.04em] sm:text-5xl md:text-6xl">
						AI that knows
						<br />
						<span className="text-primary">you.</span>
					</h1>
					<p className="mx-auto mt-6 max-w-lg font-body text-base leading-relaxed text-muted-foreground sm:text-lg">
						Your personal agent operating system — it remembers, adapts, and
						works the way you think.
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
									className="max-h-[120px] min-h-[44px] flex-1 resize-none rounded-lg bg-background px-4 py-3 font-body text-[15px] text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:ring-1 focus:ring-ring"
								/>
								<Button
									type="button"
									onClick={handleSend}
									disabled={!message.trim()}
									className="size-11 shrink-0 rounded-lg"
								>
									<Send size={18} />
								</Button>
							</div>
							<div className="mt-2 flex items-center justify-between px-1">
								<span className="font-mono text-[10px] text-muted-foreground">
									{"\u21B5"} to send
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
						<div
							key={f.title}
							className="rounded-lg border border-border bg-card p-6"
						>
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
