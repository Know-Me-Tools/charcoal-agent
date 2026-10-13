import { useId, type FC } from "react";
import { CheckIcon, GlobeIcon } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { isWebSearchEnabled } from "@/hooks/use-site-config";
import { cn } from "@/lib/utils";
import { useWebSearchPreferenceStore } from "@/stores/web-search-preference-store";
import { WEB_SEARCH_CONTENT } from "../../../content/site/web-search";

/**
 * The composer's "Search the web" control (site build only; the app build
 * renders nothing). Off by default. While on, a question is sent to a
 * third-party search service, which the tooltip and the accessible
 * description both say.
 *
 * - A real `<button aria-pressed>`: Space and Enter work, the name is the
 *   visible label, and the description is always in the DOM (touch has no
 *   hover, so the tooltip alone would hide the privacy note).
 * - The on state is never colour alone: the fill changes, a check mark appears
 *   in space that is always reserved (so nothing shifts), and the state is
 *   announced.
 * - 44 px high below 768, 32 px from 768 up, like the send button.
 * - No animation of its own; colour changes use the shared hover transition.
 */
export const WebSearchToggle: FC = () => {
  const enabled = useWebSearchPreferenceStore((s) => s.enabled);
  const setEnabled = useWebSearchPreferenceStore((s) => s.setEnabled);
  const descriptionId = useId();

  if (!isWebSearchEnabled()) return null;

  const { toggleLabel, tooltip, stateOn, stateOff } = WEB_SEARCH_CONTENT;

  return (
    <>
      <Tooltip>
        <TooltipTrigger
          render={
            <button
              type="button"
              aria-pressed={enabled}
              aria-describedby={descriptionId}
              data-state={enabled ? "on" : "off"}
              onClick={() => setEnabled(!enabled)}
              className={cn(
                "inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md px-2 font-ui text-xs font-semibold whitespace-nowrap transition-hover focus-cue max-md:min-h-11 max-md:px-3",
                enabled ? "bg-ember-soft text-fg" : "text-fg-secondary hover:bg-hover hover:text-fg",
              )}
            />
          }
        >
          <GlobeIcon className="size-3.5 shrink-0" aria-hidden="true" />
          {toggleLabel}
          <CheckIcon className={cn("size-3.5 shrink-0", !enabled && "invisible")} aria-hidden="true" />
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-64 text-xs">
          {tooltip}
        </TooltipContent>
      </Tooltip>
      <span id={descriptionId} className="sr-only">
        {tooltip} {enabled ? stateOn : stateOff}.
      </span>
    </>
  );
};
