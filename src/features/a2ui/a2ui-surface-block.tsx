import { useMemo, type FC, type ReactNode } from "react";
import { useParams } from "react-router-dom";
import {
  PrometheusA2uiProvider,
  PrometheusA2uiSurfaces,
  createDenyAllA2uiActionPolicy,
  createPrometheusA2uiRuntime,
  type PrometheusA2uiRuntime,
} from "@prometheus-ags/a2ui-react";
import { isSiteBuild } from "@/hooks/use-site-config";
import { useThreadCitations } from "@/hooks/use-thread-citations";
import { toCitedUrlSet } from "@/lib/link-policy/cited-web-url";
import { AI_SURFACE_CAPTION } from "../../../content/site/ai-disclosure";
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
const SurfaceFrame: FC<{ children: ReactNode }> = ({ children }) => (
  <div data-testid="a2ui-surface-frame" className="my-2 flex min-w-0 max-w-[65ch] flex-col gap-1">
    {children}
    <p
      data-ai-caption=""
      className="rounded-md bg-cyan-soft px-3 py-1 font-mono text-xs uppercase tracking-[0.06em] text-cyan-text"
    >
      {AI_SURFACE_CAPTION}
    </p>
  </div>
);

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
    <SurfaceFrame>
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
