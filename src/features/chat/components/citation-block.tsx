import type { FC } from "react";
import { ExternalLinkIcon, BookOpenIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { isAllowedLink } from "@/lib/link-policy/is-allowed-link";

interface CitationBlockProps {
  source: string;
  content: string;
  url?: string;
  index?: number;
  /** CitationList overrides the standalone spacing so cards use the list's own gap. */
  className?: string;
}

export const CitationBlock: FC<CitationBlockProps> = ({
  source,
  content,
  url,
  index,
  className,
}) => {
  // The URL comes from the model's stream, so it is untrusted: only a
  // corpus or site-owned destination renders as a link (FR-16,
  // site-citation-link-allowlist). Anything else still shows the full
  // destination, as plain text, instead of hiding it behind the source name.
  const isLinkAllowed = !!url && isAllowedLink(url);

  const card = (
    <div
      className={cn(
        "group my-3 flex min-w-0 items-start gap-2 rounded-lg bg-cyan-soft px-3 py-2 transition-hover first:mt-0 last:mb-0",
        isLinkAllowed && "hover:bg-hover",
        className,
      )}
    >
      <BookOpenIcon className="mt-0.5 size-3.5 shrink-0 text-cyan-text" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
          {index !== undefined && (
            <span className="font-mono text-xs font-semibold text-cyan-text">[{index}]</span>
          )}
          <span className="min-w-0 font-ui text-sm font-semibold text-fg wrap-anywhere">
            {source}
          </span>
          {isLinkAllowed && (
            <ExternalLinkIcon className="size-3.5 shrink-0 text-cyan-text" aria-hidden="true" />
          )}
        </div>
        {content && (
          <p className="mt-1 line-clamp-3 font-body text-sm leading-snug text-fg-secondary">
            {content}
          </p>
        )}
        {url && !isLinkAllowed && (
          <p className="mt-1 font-mono text-xs break-all text-fg-secondary wrap-anywhere">
            {url}
          </p>
        )}
      </div>
    </div>
  );

  if (isLinkAllowed) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className="block rounded-lg focus-cue">
        {card}
        <span className="sr-only"> (opens in a new tab)</span>
      </a>
    );
  }
  return card;
};

// Citation list — renders multiple citations below message content
interface CitationListProps {
  citations: Array<{ source: string; content: string; url?: string }>;
}

export const CitationList: FC<CitationListProps> = ({ citations }) => {
  if (citations.length === 0) return null;
  return (
    <div className="mt-4">
      <p className="font-ui text-xs font-semibold uppercase tracking-[0.12em] text-fg-secondary">
        Sources
      </p>
      <div className="mt-4 flex flex-col gap-2">
        {citations.map((c, i) => (
          <CitationBlock
            key={`${c.source}-${i}`}
            source={c.source}
            content={c.content}
            url={c.url}
            index={i + 1}
            className="my-0"
          />
        ))}
      </div>
    </div>
  );
};
