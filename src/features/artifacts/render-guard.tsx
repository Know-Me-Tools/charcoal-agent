import { AlertTriangleIcon } from "lucide-react";
import type { ReactNode } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { useBlockKey } from "@/features/render-failure/block-context";
import { RenderFailureActions } from "@/features/render-failure/render-failure-actions";
import { recordRenderFailure } from "@/features/render-failure/registry";

/** The one place the "could not be rendered" copy is written, in plain language. */
export const RENDER_FAILED_LABEL = "Diagram could not be rendered";

interface RenderGuardProps {
	children: ReactNode;
	/** Fence language, logged on failure. */
	lang: string;
	/** The block's raw text, shown as plain preformatted text if rendering throws. */
	source: string;
	/** Plain-language failure line, when the block type already has one. */
	label?: string;
}

/**
 * Per-block error boundary: one rich block that throws while rendering must not
 * take the whole chat column down. The fallback adds no copy of its own; it
 * shows the block's text and the caller's existing failure label, if any.
 */
export function RenderGuard({ children, lang, source, label }: RenderGuardProps) {
	const key = useBlockKey(lang, source);
	return (
		<ErrorBoundary
			resetKeys={[source]}
			onError={(error) => {
				// The registry logs the fixed field list; no block text, no raw message.
				recordRenderFailure({ key, kind: "render-exception", lang, source, error });
			}}
			fallbackRender={() => (
				<div className="my-3 min-w-0 overflow-hidden rounded-lg bg-surface">
					{label ? (
						<div className="flex items-center gap-2 bg-danger-soft px-3 py-2 font-ui text-sm font-semibold text-danger-text">
							<AlertTriangleIcon className="size-4 shrink-0" aria-hidden="true" />
							<span>{label}</span>
						</div>
					) : null}
					<pre className="overflow-x-auto bg-code p-3 font-mono text-xs leading-relaxed text-fg">
						<code>{source}</code>
					</pre>
					<div className="px-3 pb-3">
						<RenderFailureActions lang={lang} source={source} />
					</div>
				</div>
			)}
		>
			{children}
		</ErrorBoundary>
	);
}
