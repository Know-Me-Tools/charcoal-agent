import type { FC } from "react";
import { ExternalLinkIcon, BookOpenIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface CitationBlockProps {
  source: string;
  content: string;
  url?: string;
  index?: number;
}

export const CitationBlock: FC<CitationBlockProps> = ({
  source,
  content,
  url,
  index,
}) => {
  const inner = (
    <div
      className={cn(
        "group flex items-start gap-2 rounded-md border border-border/50 bg-muted/20 px-3 py-2 transition-colors",
        url && "cursor-pointer hover:border-primary/30 hover:bg-muted/40",
      )}
    >
      <BookOpenIcon
        size={12}
        className="mt-0.5 shrink-0 text-primary"
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          {index !== undefined && (
            <span className="font-mono text-[10px] text-primary">
              [{index}]
            </span>
          )}
          <span className="truncate font-mono text-[11px] font-medium text-foreground">
            {source}
          </span>
          {url && (
            <ExternalLinkIcon
              size={10}
              className="shrink-0 text-muted-foreground transition-colors group-hover:text-primary"
            />
          )}
        </div>
        {content && (
          <p className="mt-0.5 line-clamp-2 font-body text-[12px] leading-snug text-muted-foreground">
            {content}
          </p>
        )}
      </div>
    </div>
  );

  if (url) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className="block">
        {inner}
      </a>
    );
  }
  return inner;
};

// Citation list — renders multiple citations below message content
interface CitationListProps {
  citations: Array<{ source: string; content: string; url?: string }>;
}

export const CitationList: FC<CitationListProps> = ({ citations }) => {
  if (citations.length === 0) return null;
  return (
    <div className="mt-3 space-y-1.5">
      <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        // Sources
      </p>
      <div className="flex flex-col gap-1.5">
        {citations.map((c, i) => (
          <CitationBlock
            key={`${c.source}-${i}`}
            source={c.source}
            content={c.content}
            url={c.url}
            index={i + 1}
          />
        ))}
      </div>
    </div>
  );
};
