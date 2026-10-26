import { useAuiState } from "@assistant-ui/react";
import type { FC } from "react";
import { countComposerChars } from "@/features/chat/composer-limit";
import { cn } from "@/lib/utils";
import { COMPOSER_LIMIT_CONTENT } from "../../../content/site/composer-limit";

const { limit, showFrom, warnWithin } = COMPOSER_LIMIT_CONTENT;

/**
 * Site composer only. Silent until the message reaches `showFrom` characters,
 * then shows what is left and a hint to summarise; past `limit` it turns to a
 * clear over-limit state. The visible count follows every keystroke and is
 * hidden from assistive tech; a separate polite live region changes only in
 * steps of 100 characters (and once more when the limit is passed), so typing
 * never floods a screen reader.
 */
export const ComposerLengthCounter: FC = () => {
  const count = useAuiState((s) => countComposerChars(s.composer.text));
  const content = COMPOSER_LIMIT_CONTENT;
  const shown = count >= showFrom;
  const over = count > limit;
  const left = limit - count;
  const warn = !over && left <= warnWithin;
  const live = !shown ? "" : over ? content.liveOver : content.liveRemaining(Math.ceil(left / 100) * 100);

  return (
    <>
      {/* Mounted from the start, so the first announcement (at showFrom) is spoken. */}
      <span role="status" aria-live="polite" className="sr-only">
        {live}
      </span>
      {shown && (
        <div
          role="group"
          aria-label={content.counterLabel}
          data-state={over ? "over" : warn ? "warn" : "near"}
          className="mx-4 mb-1 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 font-ui text-xs"
        >
          <span className={cn(over ? "font-semibold text-danger-text" : "text-fg-secondary")}>
            {over ? content.hintOver : content.hint}
          </span>
          <span
            aria-hidden="true"
            className={cn(
              "tabular-nums",
              over ? "font-semibold text-danger-text" : warn ? "font-semibold text-warning-text" : "text-fg-secondary",
            )}
          >
            {over ? content.over(-left) : content.remaining(left)}
          </span>
        </div>
      )}
    </>
  );
};
