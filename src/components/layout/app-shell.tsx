import { TooltipProvider } from "@/components/ui/tooltip";
import { GraphProvider } from "@/lib/entity-graph/graph-provider";
import { AppLayout } from "@/components/layout/app-layout";

/**
 * Everything the signed-in app screens (threads, agents, settings) need that
 * the landing page does not: the entity graph and the tooltip provider. Loaded
 * as one route chunk with `AppLayout`, so neither is in the entry bundle.
 */
export default function AppShell() {
  return (
    <GraphProvider>
      <TooltipProvider>
        <AppLayout />
      </TooltipProvider>
    </GraphProvider>
  );
}
