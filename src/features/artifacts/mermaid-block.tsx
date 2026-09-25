import { AlertTriangleIcon, CheckIcon, CopyIcon, Loader2Icon, RefreshCwIcon } from "lucide-react";
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
import { ShikiCodeBlock } from "@/features/artifacts/shiki-code-block";
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

/** The one place the "could not be rendered" copy is written, in plain language. */
const RENDER_FAILED_LABEL = "Diagram could not be rendered";

// Simple error boundary — catches render-time exceptions in the SVG we inject,
// distinct from a Mermaid parse failure (handled inline in MermaidRenderer).
interface ErrorBoundaryState {
	hasError: boolean;
}

class MermaidErrorBoundary extends Component<
	{ children: ReactNode; onReset: () => void },
	ErrorBoundaryState
> {
	constructor(props: { children: ReactNode; onReset: () => void }) {
		super(props);
		this.state = { hasError: false };
	}

	static getDerivedStateFromError(): ErrorBoundaryState {
		return { hasError: true };
	}

	componentDidCatch(_error: Error, _info: ErrorInfo) {}

	render() {
		if (this.state.hasError) {
			return (
				<div className="my-3 first:mt-0 last:mb-0 flex min-w-0 items-center gap-2 rounded-lg bg-danger-soft px-3 py-2">
					<AlertTriangleIcon className="size-4 shrink-0 text-danger-text" aria-hidden="true" />
					<span className="font-ui text-sm font-semibold text-danger-text">
						{RENDER_FAILED_LABEL}
					</span>
					<Button
						variant="ghost"
						size="icon"
						className="ms-auto size-6 text-danger-text hover:bg-hover focus-cue"
						onClick={() => {
							this.setState({ hasError: false });
							this.props.onReset();
						}}
					>
						<RefreshCwIcon className="size-3.5" aria-hidden="true" />
						<span className="sr-only">Try again</span>
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
	const [hasError, setHasError] = useState(false);
	const [isCopied, setIsCopied] = useState(false);
	const [showSource, setShowSource] = useState(false);
	const idRef = useRef(`mermaid-${++mermaidIdCounter}`);
	// Re-render when the theme changes so the diagram follows the tokens.
	const theme = useUiStore((s) => s.theme);

	useEffect(() => {
		let cancelled = false;
		setSvg(null);
		setHasError(false);

		getMermaid()
			.then(async (mermaid) => {
				try {
					applyMermaidTheme(mermaid, theme === "dark");
					const { svg: rendered } = await mermaid.render(idRef.current, source.trim());
					if (!cancelled) setSvg(rendered);
				} catch {
					// The raw parser message is not user-facing (design spec §7.10);
					// the source itself is shown alongside the plain-language label.
					if (!cancelled) setHasError(true);
				}
			})
			.catch(() => {
				if (!cancelled) setHasError(true);
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

	const copyButton = (
		<button
			type="button"
			onClick={handleCopy}
			className="inline-flex items-center gap-1 rounded-sm px-2 py-1 font-ui text-xs font-semibold text-fg-secondary transition-hover hover:bg-hover hover:text-fg focus-cue"
		>
			{isCopied ? (
				<CheckIcon className="size-3.5" aria-hidden="true" />
			) : (
				<CopyIcon className="size-3.5" aria-hidden="true" />
			)}
			<span>{isCopied ? "Copied" : "Copy"}</span>
		</button>
	);

	if (hasError) {
		return (
			<div className={cn("my-3 first:mt-0 last:mb-0 min-w-0 overflow-hidden rounded-lg bg-surface", className)}>
				<div className="flex items-center justify-between gap-2 bg-raised px-3 py-1.5">
					<span className="font-ui text-xs font-semibold text-fg-secondary">Diagram</span>
					{copyButton}
				</div>
				<div className="p-3">
					<div className="mb-3 flex items-center gap-2 rounded-md bg-danger-soft px-3 py-2 font-ui text-sm font-semibold text-danger-text">
						<AlertTriangleIcon className="size-4 shrink-0" aria-hidden="true" />
						<span>{RENDER_FAILED_LABEL}</span>
					</div>
					<ShikiCodeBlock code={source} language="text" />
				</div>
			</div>
		);
	}

	return (
		<div className={cn("my-3 first:mt-0 last:mb-0 min-w-0 overflow-hidden rounded-lg bg-surface", className)}>
			{/* Header */}
			<div className="flex items-center justify-between gap-2 bg-raised px-3 py-1.5">
				<span className="font-ui text-xs font-semibold text-fg-secondary">Diagram</span>
				<div className="flex items-center gap-1">
					<button
						type="button"
						onClick={() => setShowSource((s) => !s)}
						aria-pressed={showSource}
						className="inline-flex items-center gap-1 rounded-sm px-2 py-1 font-ui text-xs font-semibold text-fg-secondary transition-hover hover:bg-hover hover:text-fg focus-cue"
					>
						{showSource ? "Diagram" : "Source"}
					</button>
					{copyButton}
				</div>
			</div>

			{/* Render area */}
			{showSource ? (
				<div className="p-3">
					<ShikiCodeBlock code={source} language="text" />
				</div>
			) : (
				<div
					ref={containerRef}
					tabIndex={0}
					role="region"
					aria-label="Diagram"
					className="flex justify-center overflow-x-auto bg-surface p-4 focus-cue [&_svg]:h-auto [&_svg]:max-w-full"
				>
					{svg ? (
						<div
							className="max-w-full"
							// biome-ignore lint/security/noDangerouslySetInnerHtml: Mermaid renders trusted SVG output
							dangerouslySetInnerHTML={{ __html: svg }}
						/>
					) : (
						<div className="flex items-center gap-2 font-mono text-xs text-faint">
							<Loader2Icon className="size-3.5 animate-spin text-cyan-text" aria-hidden="true" />
							<span>Rendering diagram</span>
						</div>
					)}
				</div>
			)}
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
