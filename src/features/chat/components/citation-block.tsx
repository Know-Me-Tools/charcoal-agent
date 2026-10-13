import { useId, type FC } from "react";
import { ExternalLinkIcon, BookOpenIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { isAllowedLink } from "@/lib/link-policy/is-allowed-link";
import { citationDisplayName, cleanCitationSnippet } from "@/features/chat/citation-text";

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
  // Cleaned at render so persisted citations read the same as new ones.
  const name = citationDisplayName(source);
  const excerpt = cleanCitationSnippet(content);

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
            {name}
          </span>
          {isLinkAllowed && (
            <ExternalLinkIcon className="size-3.5 shrink-0 text-cyan-text" aria-hidden="true" />
          )}
        </div>
        {excerpt && (
          <p className="mt-1 line-clamp-3 font-body text-sm leading-snug text-fg-secondary">
            {excerpt}
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

export interface CitationListItem {
  source: string;
  content: string;
  url?: string;
  /** The stream's citation marker, when the event carried one. */
  index?: number;
}

interface CitationListProps {
  citations: ReadonlyArray<CitationListItem>;
}

/**
 * One "Sources" block for a run of citations (operator decision D-1 (b)):
 * a numbered list in arrival order. The number is the stream's marker when
 * present, so it matches the `[n]` the reply text refers to, otherwise the
 * position in the list.
 */
export const CitationList: FC<CitationListProps> = ({ citations }) => {
  const headingId = useId();
  if (citations.length === 0) return null;
  return (
    <div data-testid="citation-sources" className="my-3 min-w-0 first:mt-0 last:mb-0">
      <p
        id={headingId}
        className="font-ui text-xs font-semibold uppercase tracking-[0.12em] text-fg-secondary"
      >
        Sources
      </p>
      <ol aria-labelledby={headingId} className="mt-4 flex min-w-0 flex-col gap-2">
        {citations.map((c, i) => {
          const number = c.index ?? i + 1;
          return (
            <li key={`${c.source}-${i}`} value={number} className="min-w-0">
              <CitationBlock
                source={c.source}
                content={c.content}
                url={c.url}
                index={number}
                className="my-0"
              />
            </li>
          );
        })}
      </ol>
    </div>
  );
};
