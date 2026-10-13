import { GraphProvider } from "@/lib/entity-graph/graph-provider";
import { useSkillsSyncOnMount } from "@/hooks/use-skills-sync";

/**
 * App-build only: pushes the built-in skills to UAR once on first load, on
 * whatever route that is. Lazy-loaded from `App.tsx` and never mounted on the
 * site build (where the sync is a no-op), so the entity graph stays out of the
 * site's entry chunk. It shares the module-level app graph store with the
 * route shell's own `GraphProvider`.
 */
function SkillsSyncEffect() {
  useSkillsSyncOnMount();
  return null;
}

export default function SkillsSyncBootstrap() {
  return (
    <GraphProvider>
      <SkillsSyncEffect />
    </GraphProvider>
  );
}
