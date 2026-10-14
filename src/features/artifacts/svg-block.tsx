import { DownloadIcon } from "lucide-react";
import { type FC, useRef, useState } from "react";
import { CopyButton } from "@/components/common/copy-button";
import { Button } from "@/components/ui/button";
import { ShikiCodeBlock } from "@/features/artifacts/shiki-code-block";
import { svgBlockText } from "@/features/blocks/block-text";
import { selectElementText } from "@/hooks/use-copy-to-clipboard";
import { cn } from "@/lib/utils";
import { BLOCK_COPY_CONTENT } from "../../../content/site/block-copy";

/** Largest SVG source (UTF-8 bytes) that is rendered; a bigger one shows source only. */
export const SVG_SIZE_CAP_BYTES = 256 * 1024;
/** How long the download's Blob URL lives before it is revoked. */
const REVOKE_DELAY_MS = 1000;
const DOWNLOAD_FILE_NAME = "diagram.svg";
const SVG_MIME = "image/svg+xml";

/** An optional XML prolog, then an `<svg` element start. */
const SVG_START = /^(?:<\?xml[^>]*\?>\s*)?<svg[\s/>]/i;

/** True when the text, trimmed, starts with an svg element (after an optional XML prolog). */
export function isSvgSource(source: string): boolean {
	return SVG_START.test(source.trim());
}

function byteLength(text: string): number {
	return new TextEncoder().encode(text).length;
}

/** Lone surrogates are not valid text and make `encodeURIComponent` throw; replace them with U+FFFD. */
function wellFormed(text: string): string {
	const native = (text as string & { toWellFormed?: () => string }).toWellFormed;
	if (typeof native === "function") return native.call(text);
	return text.replace(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/g, "\uFFFD");
}

/**
 * The only way the SVG reaches the DOM: an image source, which cannot run scripts or load resources.
 * Total: returns null when encoding fails, so the caller shows the source view instead of throwing.
 */
function toDataUrl(source: string): string | null {
	try {
		return `data:${SVG_MIME};charset=utf-8,${encodeURIComponent(wellFormed(source).trim())}`;
	} catch {
		return null;
	}
}

function downloadSvg(source: string): void {
	const url = URL.createObjectURL(new Blob([source], { type: SVG_MIME }));
	const anchor = document.createElement("a");
	anchor.href = url;
	anchor.download = DOWNLOAD_FILE_NAME;
	anchor.click();
	setTimeout(() => URL.revokeObjectURL(url), REVOKE_DELAY_MS);
}

interface SvgBlockProps {
	source: string;
	className?: string;
}

/**
 * A fenced `svg` block. The SVG is untrusted model output, so it is shown
 * ONLY as `<img src="data:image/svg+xml,...">`: an image context runs no
 * script and fetches no external resource. Never inject it as markup.
 */
export const SvgBlock: FC<SvgBlockProps> = ({ source, className }) => {
	const [showSource, setShowSource] = useState(false);
	const sourceWrapRef = useRef<HTMLDivElement>(null);

	if (!isSvgSource(source)) {
		return <ShikiCodeBlock code={source} language="text" className={className} />;
	}

	const tooLarge = byteLength(source) > SVG_SIZE_CAP_BYTES;
	const dataUrl = tooLarge ? null : toDataUrl(source);
	const sourceOnly = tooLarge || showSource || dataUrl === null;

	const handleSelectFallback = () => {
		setShowSource(true);
		requestAnimationFrame(() => {
			selectElementText(sourceWrapRef.current?.querySelector("[data-copy-region]"));
		});
	};

	return (
		<div className={cn("my-3 first:mt-0 last:mb-0 min-w-0 overflow-hidden rounded-lg bg-surface", className)}>
			<div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1 bg-raised px-3 py-1.5">
				<span className="font-ui text-xs font-semibold text-fg-secondary">{BLOCK_COPY_CONTENT.svgTitle}</span>
				<div className="flex flex-wrap items-center gap-1">
					{!tooLarge && (
						<>
							<Button
								variant="ghost"
								size="xs"
								aria-pressed={!showSource}
								onClick={() => setShowSource(false)}
								className="font-ui font-semibold text-fg-secondary focus-cue max-md:min-h-11 max-md:px-3"
							>
								{BLOCK_COPY_CONTENT.svgPreview}
							</Button>
							<Button
								variant="ghost"
								size="xs"
								aria-pressed={showSource}
								onClick={() => setShowSource(true)}
								className="font-ui font-semibold text-fg-secondary focus-cue max-md:min-h-11 max-md:px-3"
							>
								{BLOCK_COPY_CONTENT.svgSource}
							</Button>
						</>
					)}
					<CopyButton
						variant="labeled"
						text={svgBlockText(source)}
						label={BLOCK_COPY_CONTENT.copySvgSource}
						selectFallback={handleSelectFallback}
					/>
					<Button
						variant="ghost"
						size="xs"
						aria-label={BLOCK_COPY_CONTENT.svgDownloadLabel}
						onClick={() => downloadSvg(svgBlockText(source))}
						className="font-ui font-semibold text-fg-secondary focus-cue max-md:min-h-11 max-md:px-3"
					>
						<DownloadIcon data-icon="inline-start" aria-hidden="true" />
						{BLOCK_COPY_CONTENT.svgDownload}
					</Button>
				</div>
			</div>

			{tooLarge && (
				<p className="px-3 pt-3 font-ui text-sm text-fg-secondary">{BLOCK_COPY_CONTENT.svgTooLarge}</p>
			)}

			{sourceOnly ? (
				<div className="p-3" ref={sourceWrapRef}>
					<ShikiCodeBlock code={source} language="svg" hideCopy />
				</div>
			) : (
				<div className="flex justify-center overflow-x-auto bg-surface p-4">
					<img
						src={dataUrl ?? undefined}
						alt={BLOCK_COPY_CONTENT.svgAlt}
						className="h-auto max-w-full"
						style={{ height: "auto", maxWidth: "100%" }}
					/>
				</div>
			)}
		</div>
	);
};
