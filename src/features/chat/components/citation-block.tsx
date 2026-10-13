import { useId, useState, type FC } from "react";
import { ChevronDownIcon, ExternalLinkIcon, BookOpenIcon } from "lucide-react";
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

/**
 * One source: title and `[n]` on a single row, the excerpt behind an expand
 * control (P1-1). The title row is the link when the destination is allowed;
 * the expand control is a sibling button, never nested in the link.
 */
export const CitationBlock: FC<CitationBlockProps> = ({
  source,
  content,
  url,
  index,
  className,
}) => {
  const [expanded, setExpanded] = useState(false);
  const excerptId = useId();
  // The URL comes from the model's stream, so it is untrusted: only a
  // corpus or site-owned destination renders as a link (FR-16,
  // site-citation-link-allowlist). Anything else still shows the full
  // destination, as plain text, instead of hiding it behind the source name.
  const isLinkAllowed = !!url && isAllowedLink(url);
  // Cleaned at render so persisted citations read the same as new ones.
  const name = citationDisplayName(source);
  const excerpt = cleanCitationSnippet(content);

  const title = (
    <span className="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
      {index !== undefined && (
        <span className="font-mono text-xs font-semibold text-cyan-text">[{index}]</span>
      )}
      <span className="min-w-0 font-ui text-sm font-semibold text-fg wrap-anywhere">{name}</span>
      {isLinkAllowed && (
        <ExternalLinkIcon className="size-3.5 shrink-0 self-center text-cyan-text" aria-hidden="true" />
      )}
    </span>
  );

  return (
    <div
      className={cn(
        "my-3 min-w-0 rounded-lg bg-cyan-soft px-3 py-2 first:mt-0 last:mb-0",
        className,
      )}
    >
      <div className="flex min-w-0 items-start gap-2">
        <BookOpenIcon className="mt-0.5 size-3.5 shrink-0 text-cyan-text" aria-hidden="true" />
        {isLinkAllowed ? (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-w-0 flex-1 rounded-sm transition-hover hover:bg-hover focus-cue"
          >
            {title}
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        ) : (
          title
        )}
        {excerpt && (
          <button
            type="button"
            aria-expanded={expanded}
            aria-controls={excerptId}
            aria-label={expanded ? "Hide excerpt" : "Show excerpt"}
            onClick={() => setExpanded((open) => !open)}
            className="-my-1 -mr-1.5 flex size-8 shrink-0 items-center justify-center rounded-md text-cyan-text transition-hover hover:bg-hover focus-cue"
          >
            <ChevronDownIcon className={cn("size-3.5", expanded && "rotate-180")} aria-hidden="true" />
          </button>
        )}
      </div>
      {excerpt && expanded && (
        <p id={excerptId} className="mt-1 pl-[1.375rem] font-body text-sm leading-snug text-fg-secondary">
          {excerpt}
        </p>
      )}
      {url && !isLinkAllowed && (
        <p className="mt-1 pl-[1.375rem] font-mono text-xs break-all text-fg-secondary wrap-anywhere">
          {url}
        </p>
      )}
    </div>
  );
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
  /** While the reply streams, one status line stands in for the cards. */
  streaming?: boolean;
}

/**
 * One "Sources" block for a run of citations (operator decision D-1 (b)):
 * a numbered list in arrival order. The number is the stream's marker when
 * present, so it matches the `[n]` the reply text refers to, otherwise the
 * position in the list. Placed after the reply text (see
 * `arrangeAssistantParts`); while streaming it is one line.
 */
export const CitationList: FC<CitationListProps> = ({ citations, streaming = false }) => {
  const headingId = useId();
  if (citations.length === 0) return null;

  if (streaming) {
    return (
      <p
        role="status"
        data-testid="citation-sources-reading"
        className="my-1.5 flex max-w-[65ch] items-center gap-2 py-1.5 font-ui text-xs font-semibold text-cyan-text first:mt-0 last:mb-0"
      >
        <span className="flex size-3.5 shrink-0 items-center justify-center" aria-hidden="true">
          <span className="size-1.5 animate-shimmer rounded-full bg-cyan motion-reduce:animate-none" />
        </span>
        {`Reading ${citations.length} ${citations.length === 1 ? "source" : "sources"}`}
      </p>
    );
  }

  return (
    <div data-testid="citation-sources" className="my-3 min-w-0 max-w-[65ch] first:mt-0 last:mb-0">
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
