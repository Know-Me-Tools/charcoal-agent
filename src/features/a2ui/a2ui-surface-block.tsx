import { useMemo, type FC } from "react";
import {
  PrometheusA2uiProvider,
  PrometheusA2uiSurfaces,
  createDenyAllA2uiActionPolicy,
  createPrometheusA2uiRuntime,
  type PrometheusA2uiRuntime,
} from "@prometheus-ags/a2ui-react";
import { parseA2uiArtifactContent } from "./carrier-adapter";
import { createKnowmeA2uiCatalogs } from "./catalog";

const FAILURE_COPY = "This interface could not be displayed.";

type Prepared = { ok: true; runtime: PrometheusA2uiRuntime } | { ok: false };

/**
 * Parse the carrier and load it into a fresh runtime. Surfaces are render-only:
 * the runtime keeps its deny-all action policy, and the catalog's Button is
 * disabled, so nothing reaches UAR from here.
 */
function prepare(content: string): Prepared {
  const parsed = parseA2uiArtifactContent(content);
  if (!parsed.ok) return { ok: false };
  try {
    const runtime = createPrometheusA2uiRuntime({
      catalogs: createKnowmeA2uiCatalogs(),
      actionPolicy: createDenyAllA2uiActionPolicy(),
    });
    runtime.processMessages(parsed.messages);
    return { ok: true, runtime };
  } catch {
    return { ok: false };
  }
}

export interface A2uiSurfaceBlockProps {
  /** NDJSON v0.9.1 from the `agui.artifact` `content` field. */
  content: string;
  title?: string;
}

export const A2uiSurfaceBlock: FC<A2uiSurfaceBlockProps> = ({ content, title }) => {
  const prepared = useMemo(() => prepare(content), [content]);

  if (!prepared.ok) {
    return (
      <p role="status" data-testid="a2ui-surface-error" className="text-sm text-faint">
        {FAILURE_COPY}
      </p>
    );
  }

  return (
    <section
      aria-label={title || "Interactive content"}
      data-testid="a2ui-surface"
      className="my-2 max-w-full overflow-x-auto"
    >
      <PrometheusA2uiProvider runtime={prepared.runtime}>
        <PrometheusA2uiSurfaces />
      </PrometheusA2uiProvider>
    </section>
  );
};

export default A2uiSurfaceBlock;
