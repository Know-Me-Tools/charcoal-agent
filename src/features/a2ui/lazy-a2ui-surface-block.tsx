import { lazy, Suspense, type FC } from "react";
import type { A2uiSurfaceBlockProps } from "./a2ui-surface-block";

const Surface = lazy(() => import("./a2ui-surface-block"));

/**
 * The A2UI runtime and the Lit-backed official packages load in their own
 * chunk, only when a surface arrives.
 */
export const LazyA2uiSurfaceBlock: FC<A2uiSurfaceBlockProps> = (props) => (
  <Suspense fallback={<div aria-hidden className="my-2 h-16 rounded-xl bg-muted-surface" />}>
    <Surface {...props} />
  </Suspense>
);
