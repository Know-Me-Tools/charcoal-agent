import { useRef, useState, type FC, type HTMLAttributes, type ImgHTMLAttributes, type TableHTMLAttributes } from "react";
import { CopyButton } from "@/components/common/copy-button";
import { selectElementText } from "@/hooks/use-copy-to-clipboard";
import { mathBlockText, tableBlockText } from "@/features/blocks/block-text";
import { cn } from "@/lib/utils";
import { BLOCK_COPY_CONTENT } from "../../../content/site/block-copy";

/**
 * Copy controls for the markdown blocks of a reply: tables, display math and
 * images (change `app-block-copy-and-media-blocks`, task 3.3). Each button is
 * rendered by the app around the block the markdown pipeline already
 * produced; nothing here changes what the sanitizer or the reply policy
 * lets through, and an image only reaches this component after the policy
 * kept it.
 */

/** A GFM table in a scroll region, with a Copy button that copies it as markdown. */
export const MarkdownTable: FC<TableHTMLAttributes<HTMLTableElement>> = ({ className, ...props }) => {
  const tableRef = useRef<HTMLTableElement>(null);
  return (
    <div className="my-3 flex flex-col gap-1">
      <div className="flex justify-end">
        <CopyButton
          variant="labeled"
          label={BLOCK_COPY_CONTENT.copyTable}
          text={() => tableBlockText(tableRef.current)}
          selectFallback={() => selectElementText(tableRef.current)}
        />
      </div>
      <div className="overflow-x-auto rounded-lg bg-surface focus-cue" tabIndex={0} role="region" aria-label="Table">
        <table ref={tableRef} className={cn("w-full border-separate border-spacing-0 text-sm", className)} {...props} />
      </div>
    </div>
  );
};

const TEX_ANNOTATION = 'annotation[encoding="application/x-tex"]';

/** The TeX source KaTeX keeps in its MathML annotation, or "" when it is absent. */
function readTex(root: Element | null): string {
  return mathBlockText(root?.querySelector(TEX_ANNOTATION)?.textContent);
}

function hasClass(className: unknown, name: string): boolean {
  return typeof className === "string" && className.split(/\s+/).includes(name);
}

const DisplayMath: FC<HTMLAttributes<HTMLSpanElement>> = ({ className, children, ...props }) => {
  const ref = useRef<HTMLSpanElement>(null);
  return (
    <span ref={ref} className={cn(className, "relative block")} {...props}>
      {children}
      <span className="absolute end-0 top-0">
        <CopyButton
          label={BLOCK_COPY_CONTENT.copyMath}
          text={() => readTex(ref.current)}
          selectFallback={() => selectElementText(ref.current)}
        />
      </span>
    </span>
  );
};

/**
 * `span` override: display math (KaTeX's `katex-display`) gets a button;
 * inline math and every other span pass through untouched.
 */
export const MarkdownSpan: FC<HTMLAttributes<HTMLSpanElement>> = (props) =>
  hasClass(props.className, "katex-display") ? <DisplayMath {...props} /> : <span {...props} />;

/** Re-encodes any browser-decodable image as PNG, the one type every ClipboardItem accepts. */
async function toPngBlob(blob: Blob): Promise<Blob> {
  if (blob.type === "image/png") return blob;
  const bitmap = await createImageBitmap(blob);
  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("no 2d canvas");
  context.drawImage(bitmap, 0, 0);
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((png) => (png ? resolve(png) : reject(new Error("png encode failed"))), "image/png");
  });
}

type ImageCopyMode = "image" | "link";

/**
 * Copies the image as PNG when the browser has `ClipboardItem` and the bytes
 * are readable; otherwise copies the image URL. Returns which one happened.
 */
async function copyImage(url: string): Promise<ImageCopyMode> {
  const clipboard = typeof navigator === "undefined" ? undefined : navigator.clipboard;
  if (clipboard && typeof clipboard.write === "function" && typeof ClipboardItem !== "undefined") {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`image fetch ${response.status}`);
      const png = await toPngBlob(await response.blob());
      await clipboard.write([new ClipboardItem({ "image/png": png })]);
      return "image";
    } catch {
      // Fall through to the URL: the bytes were unreadable or the write was refused.
    }
  }
  if (!clipboard || typeof clipboard.writeText !== "function") throw new Error("no clipboard");
  await clipboard.writeText(url);
  return "link";
}

/** A reply image (already allowed by the reply policy) with a Copy button. */
export const MarkdownImage: FC<ImgHTMLAttributes<HTMLImageElement>> = ({ className, src, ...props }) => {
  const [mode, setMode] = useState<ImageCopyMode>("image");
  const url = typeof src === "string" ? src : "";
  return (
    <span className="relative my-3 inline-block max-w-full align-top">
      <img
        className={cn("h-auto max-w-full rounded-lg bg-muted-surface", className)}
        loading="lazy"
        decoding="async"
        src={src}
        {...props}
      />
      {url !== "" && (
        <span className="absolute end-2 top-2 rounded-sm bg-surface">
          <CopyButton
            label={BLOCK_COPY_CONTENT.copyImage}
            copiedLabel={mode === "image" ? BLOCK_COPY_CONTENT.copiedImage : BLOCK_COPY_CONTENT.copiedImageLink}
            text={url}
            write={async (value) => setMode(await copyImage(value))}
          />
        </span>
      )}
    </span>
  );
};
