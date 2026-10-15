import { useMemo, useRef, type FC, type ReactNode } from "react";
import { useParams } from "react-router-dom";
import {
  PrometheusA2uiProvider,
  PrometheusA2uiSurfaces,
  createDenyAllA2uiActionPolicy,
  createPrometheusA2uiRuntime,
  type PrometheusA2uiRuntime,
} from "@prometheus-ags/a2ui-react";
import { CopyButton } from "@/components/common/copy-button";
import { cardBlockText } from "@/features/blocks/block-text";
import { selectElementText } from "@/hooks/use-copy-to-clipboard";
import { isSiteBuild } from "@/hooks/use-site-config";
import { useThreadCitations } from "@/hooks/use-thread-citations";
import { toCitedUrlSet } from "@/lib/link-policy/cited-web-url";
import { AI_SURFACE_CAPTION } from "../../../content/site/ai-disclosure";
import { BLOCK_COPY_CONTENT } from "../../../content/site/block-copy";
import { PASSIVE_A2UI_COMPONENTS, parseA2uiArtifactContent } from "./carrier-adapter";
import { cleanAnswerCardSources } from "./answer-card-source";
import { createKnowmeA2uiCatalogs } from "./catalog";
import { CitedUrlsProvider } from "./cited-urls";

const FAILURE_COPY = "This interface could not be displayed.";

type Prepared = { ok: true; runtime: PrometheusA2uiRuntime } | { ok: false };

/**
 * Parse the carrier and load it into a fresh runtime. Surfaces are render-only:
 * the runtime keeps its deny-all action policy, and the catalog's Button is
 * disabled, so nothing reaches UAR from here.
 */
function prepare(content: string, passiveOnly: boolean): Prepared {
  const parsed = parseA2uiArtifactContent(
    content,
    passiveOnly ? { allowedComponents: PASSIVE_A2UI_COMPONENTS } : {},
  );
  if (!parsed.ok) return { ok: false };
  try {
    const runtime = createPrometheusA2uiRuntime({
      catalogs: createKnowmeA2uiCatalogs(),
      actionPolicy: createDenyAllA2uiActionPolicy(),
    });
    runtime.processMessages(cleanAnswerCardSources(parsed.messages));
    return { ok: true, runtime };
  } catch {
    return { ok: false };
  }
}

export interface A2uiSurfaceBlockProps {
  /** NDJSON v0.9.1 from the `agui.artifact` `content` field. */
  content: string;
  title?: string;
  /**
   * Render only layout and text, never a field, checkbox, picker or button.
   * Defaults to on for the public site build, where the visitor is anonymous.
   */
  passiveOnly?: boolean;
}

/**
 * W3 (site-answer-card-and-sources, task 5.3): every surface, including one
 * that failed to parse, sits in this frame with a fixed caption rendered by
 * the app, after and outside the model's content. Its text is a constant and
 * it is the only element carrying `data-ai-caption`; the model's catalog has
 * no way to set attributes, and its `Text` caption variant is a different,
 * unmarked style, so model output can neither fill nor imitate this slot.
 */
/**
 * The lines of text a rendered card shows, read from the surface element: each
 * element that owns text contributes one line, in document order, repeats
 * dropped. Mapped to the title (first line), the summary (the lines between)
 * and the source (the last line of three or more) for `cardBlockText`.
 */
function readCardText(surface: Element | null): string {
  const lines: string[] = [];
  surface?.querySelectorAll("*").forEach((el) => {
    const own = Array.from(el.childNodes)
      .filter((n) => n.nodeType === Node.TEXT_NODE)
      .map((n) => n.textContent ?? "")
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();
    if (own !== "" && !lines.includes(own)) lines.push(own);
  });
  const [title, ...rest] = lines;
  const source = rest.length >= 2 ? rest[rest.length - 1] : undefined;
  const summary = (source === undefined ? rest : rest.slice(0, -1)).join("\n");
  return cardBlockText({ title, summary, source });
}

/**
 * The Copy button lives here, in the app-rendered frame beside the caption,
 * never in the model's surface: model output cannot set, hide or relabel it,
 * and it is a plain app button outside the passive-only component set. It is
 * shown only for a surface that parsed (`copyable`).
 */
const SurfaceFrame: FC<{ children: ReactNode; copyable?: boolean }> = ({ children, copyable = false }) => {
  const frameRef = useRef<HTMLDivElement>(null);
  const surface = () => frameRef.current?.querySelector('[data-testid="a2ui-surface"]') ?? null;
  return (
    <div ref={frameRef} data-testid="a2ui-surface-frame" className="my-2 flex min-w-0 max-w-[65ch] flex-col gap-1">
      {children}
      <div className="flex items-center gap-1">
        <p
          data-ai-caption=""
          className="min-w-0 flex-1 rounded-md bg-cyan-soft px-3 py-1 font-mono text-xs uppercase tracking-[0.06em] text-cyan-text"
        >
          {AI_SURFACE_CAPTION}
        </p>
        {copyable && (
          <CopyButton
            label={BLOCK_COPY_CONTENT.copyCard}
            text={() => readCardText(surface())}
            selectFallback={() => selectElementText(surface())}
          />
        )}
      </div>
    </div>
  );
};

export const A2uiSurfaceBlock: FC<A2uiSurfaceBlockProps> = ({
  content,
  title,
  passiveOnly = isSiteBuild(),
}) => {
  const prepared = useMemo(() => prepare(content, passiveOnly), [content, passiveOnly]);
  // The thread's web citation URLs: the only URLs a card shows as links.
  const { id: threadId } = useParams<{ id: string }>();
  const citations = useThreadCitations(threadId);
  const citedUrls = useMemo(
    () => toCitedUrlSet(citations.filter((c) => c.origin === "web").map((c) => c.url)),
    [citations],
  );

  if (!prepared.ok) {
    return (
      <SurfaceFrame>
        <p role="status" data-testid="a2ui-surface-error" className="text-sm text-faint">
          {FAILURE_COPY}
        </p>
      </SurfaceFrame>
    );
  }

  return (
    <SurfaceFrame copyable>
      <section
        aria-label={title || "Interactive content"}
        data-testid="a2ui-surface"
        className="max-w-full overflow-x-auto"
      >
        <CitedUrlsProvider value={citedUrls}>
          <PrometheusA2uiProvider runtime={prepared.runtime}>
            <PrometheusA2uiSurfaces />
          </PrometheusA2uiProvider>
        </CitedUrlsProvider>
      </section>
    </SurfaceFrame>
  );
};

export default A2uiSurfaceBlock;
