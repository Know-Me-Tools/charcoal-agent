import type { FC } from "react";
import { cn } from "@/lib/utils";
import { EXTERNAL_LINK_PROPS, isCitedWebUrl, splitUrls } from "@/lib/link-policy/cited-web-url";
import { useCitedUrls } from "./cited-urls";

/**
 * Card text with its cited URLs as links. A URL the model typed that is not a
 * web citation of this thread stays plain text, so a card cannot plant a
 * clickable link. The URL text itself is the link text: the destination is
 * what the visitor reads.
 */
export const LinkedText: FC<{ text: string; className?: string }> = ({ text, className }) => {
  const cited = useCitedUrls();
  const pieces = splitUrls(text);
  if (!pieces.some((p) => p.kind === "url" && isCitedWebUrl(p.value, cited))) return <>{text}</>;
  return (
    <>
      {pieces.map((piece, i) =>
        piece.kind === "url" && isCitedWebUrl(piece.value, cited) ? (
          <a
            key={i}
            href={piece.value}
            {...EXTERNAL_LINK_PROPS}
            className={cn(
              "break-all rounded-sm text-cyan-text underline underline-offset-2 transition-hover hover:bg-hover focus-cue",
              className,
            )}
          >
            {piece.value}
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        ) : (
          <span key={i}>{piece.value}</span>
        ),
      )}
    </>
  );
};
