import {
	AlertCircleIcon,
	CheckIcon,
	CopyIcon,
	RefreshCwIcon,
} from "lucide-react";
import {
	Component,
	type ErrorInfo,
	type FC,
	type ReactNode,
	useEffect,
	useRef,
	useState,
} from "react";
import { Button } from "@/components/ui/button";
import { useUiStore } from "@/stores/ui-store";
import { cn } from "@/lib/utils";

// Lazy mermaid import
let mermaidModule: typeof import("mermaid").default | null = null;
let mermaidLoadPromise: Promise<typeof import("mermaid").default> | null = null;

async function getMermaid() {
	if (mermaidModule) return mermaidModule;
	mermaidLoadPromise ??= import("mermaid").then((m) => {
		mermaidModule = m.default;
		return mermaidModule;
	});
	return mermaidLoadPromise;
}

/** Read a KnowMe token from the active theme (see src/styles/tokens.css). */
function token(name: string): string {
	return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

/** Point Mermaid at the current theme's KnowMe tokens (called before each render). */
function applyMermaidTheme(mermaid: typeof import("mermaid").default, isDark: boolean): void {
	mermaid.initialize({
		startOnLoad: false,
		// Built-in themes keep Mermaid's layout metrics; token colors override them.
		theme: isDark ? "dark" : "default",
		fontFamily: "JetBrains Mono, monospace",
		themeVariables: {
			primaryColor: token("--km-raised"),
			primaryTextColor: token("--km-fg"),
			primaryBorderColor: token("--km-fg-faint"),
			nodeBorder: token("--km-fg-faint"),
			clusterBorder: token("--km-fg-faint"),
			clusterBkg: token("--km-surface"),
			lineColor: token("--km-fg-secondary"),
			background: token("--km-code"),
			mainBkg: token("--km-raised"),
			secondaryColor: token("--km-hover"),
			tertiaryColor: token("--km-surface"),
			edgeLabelBackground: token("--km-surface"),
			nodeTextColor: token("--km-fg"),
			textColor: token("--km-fg"),
		},
	});
}

// Simple error boundary
interface ErrorBoundaryState {
	hasError: boolean;
	error: Error | null;
}

class MermaidErrorBoundary extends Component<
	{ children: ReactNode; onReset: () => void },
	ErrorBoundaryState
> {
	constructor(props: { children: ReactNode; onReset: () => void }) {
		super(props);
		this.state = { hasError: false, error: null };
	}

	static getDerivedStateFromError(error: Error): ErrorBoundaryState {
		return { hasError: true, error };
	}

	componentDidCatch(_error: Error, _info: ErrorInfo) {}

	render() {
		if (this.state.hasError) {
			return (
				<div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-danger-text text-sm">
					<AlertCircleIcon size={14} />
					<span className="font-mono text-xs">Diagram error</span>
					<Button
						variant="ghost"
						size="icon"
						className="ml-auto size-6"
						onClick={() => {
							this.setState({ hasError: false, error: null });
							this.props.onReset();
						}}
					>
						<RefreshCwIcon size={12} />
					</Button>
				</div>
			);
		}
		return this.props.children;
	}
}

interface MermaidBlockProps {
	source: string;
	className?: string;
}

let mermaidIdCounter = 0;

const MermaidRenderer: FC<MermaidBlockProps> = ({ source, className }) => {
	const containerRef = useRef<HTMLDivElement>(null);
	const [svg, setSvg] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [isCopied, setIsCopied] = useState(false);
	const idRef = useRef(`mermaid-${++mermaidIdCounter}`);
	// Re-render when the theme changes so the diagram follows the tokens.
	const theme = useUiStore((s) => s.theme);

	useEffect(() => {
		let cancelled = false;
		setSvg(null);
		setError(null);

		getMermaid()
			.then(async (mermaid) => {
				try {
					applyMermaidTheme(mermaid, theme === "dark");
					const { svg: rendered } = await mermaid.render(
						idRef.current,
						source.trim(),
					);
					if (!cancelled) setSvg(rendered);
				} catch (err) {
					if (!cancelled) {
						setError(
							err instanceof Error ? err.message : "Failed to render diagram",
						);
					}
				}
			})
			.catch((err: unknown) => {
				if (!cancelled) {
					setError(
						err instanceof Error ? err.message : "Failed to load Mermaid",
					);
				}
			});

		return () => {
			cancelled = true;
		};
	}, [source, theme]);

	const handleCopy = () => {
		navigator.clipboard.writeText(source).then(() => {
			setIsCopied(true);
			setTimeout(() => setIsCopied(false), 2500);
		});
	};

	if (error) {
		return (
			<div
				className={cn(
					"overflow-hidden rounded-lg border border-destructive/30",
					className,
				)}
			>
				<div className="flex items-center justify-between border-b border-border/50 bg-muted/50 px-3 py-1.5">
					<span className="font-mono text-[11px] text-ember-text">mermaid</span>
					<Button
						variant="ghost"
						size="sm"
						onClick={handleCopy}
						className="h-auto gap-1 px-1.5 py-0.5 font-ui text-[11px] text-muted-foreground hover:bg-border/50 hover:text-foreground"
					>
						{isCopied ? <CheckIcon size={11} /> : <CopyIcon size={11} />}
					</Button>
				</div>
				<div className="flex items-start gap-2 p-3">
					<AlertCircleIcon
						size={14}
						className="mt-0.5 shrink-0 text-danger-text"
					/>
					<div>
						<p className="font-mono text-xs text-danger-text">
							Diagram parse error
						</p>
						<p className="mt-1 font-mono text-[10px] text-muted-foreground">
							{error}
						</p>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div
			className={cn(
				"overflow-hidden rounded-lg border border-border/50",
				className,
			)}
		>
			{/* Header */}
			<div className="flex items-center justify-between border-b border-border/50 bg-muted/50 px-3 py-1.5">
				<span className="font-mono text-[11px] text-ember-text lowercase">
					{"// diagram"}
				</span>
				<Button
					variant="ghost"
					size="sm"
					onClick={handleCopy}
					aria-label={isCopied ? "Copied" : "Copy source"}
					className="h-auto gap-1 px-1.5 py-0.5 font-ui text-[11px] text-muted-foreground transition-colors hover:bg-border/50 hover:text-foreground"
				>
					{isCopied ? (
						<>
							<CheckIcon size={11} />
							<span>Copied</span>
						</>
					) : (
						<>
							<CopyIcon size={11} />
							<span>Copy</span>
						</>
					)}
				</Button>
			</div>

			{/* Render area */}
			<div
				ref={containerRef}
				className="flex items-center justify-center overflow-x-auto bg-card p-4"
			>
				{svg ? (
					<div
						className="max-w-full [&_svg]:max-w-full [&_svg]:h-auto"
						// biome-ignore lint/security/noDangerouslySetInnerHtml: Mermaid renders trusted SVG output
						dangerouslySetInnerHTML={{ __html: svg }}
					/>
				) : (
					<div className="flex items-center gap-2 text-muted-foreground text-sm">
						<div className="h-3 w-3 animate-spin rounded-full border-2 border-border border-t-primary" />
						<span className="font-mono text-xs">Rendering diagram…</span>
					</div>
				)}
			</div>
		</div>
	);
};

export const MermaidBlock: FC<MermaidBlockProps> = ({ source, className }) => {
	const [key, setKey] = useState(0);
	return (
		<MermaidErrorBoundary onReset={() => setKey((k) => k + 1)}>
			<MermaidRenderer key={key} source={source} className={className} />
		</MermaidErrorBoundary>
	);
};
