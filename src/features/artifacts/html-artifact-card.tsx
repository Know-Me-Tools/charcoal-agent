import { useState, type FC } from "react";
import {
  CopyIcon,
  CheckIcon,
  EyeIcon,
  Code2Icon,
  ExternalLinkIcon,
  MaximizeIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ShikiCodeBlock } from "./shiki-code-block";

interface HtmlArtifactCardProps {
  code: string;
  language?: "html" | "tsx" | "jsx" | "svg";
  title?: string;
  className?: string;
}

type ViewMode = "preview" | "code";

export const HtmlArtifactCard: FC<HtmlArtifactCardProps> = ({
  code,
  language = "html",
  title,
  className,
}) => {
  const [view, setView] = useState<ViewMode>("preview");
  const [isCopied, setIsCopied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    });
  };

  const handleOpenInNewTab = () => {
    const blob = new Blob([code], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
    // Clean up after a short delay
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
  };

  const displayTitle = title ?? `// ${language} artifact`;

  return (
    <div
      className={cn(
        "overflow-hidden rounded-lg border border-border/50 transition-all",
        isExpanded && "fixed inset-4 z-50 shadow-2xl",
        className,
      )}
    >
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b border-border/50 bg-muted/50 px-3 py-1.5">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[11px] text-ember-text">{displayTitle}</span>
        </div>

        <div className="flex items-center gap-1">
          {/* View toggle */}
          <div className="flex rounded-md border border-border/50 bg-background">
            <button
              onClick={() => setView("preview")}
              className={cn(
                "flex items-center gap-1 rounded-l-md px-2 py-1 font-ui text-[11px] transition-colors",
                view === "preview"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <EyeIcon size={10} />
              <span>Preview</span>
            </button>
            <button
              onClick={() => setView("code")}
              className={cn(
                "flex items-center gap-1 rounded-r-md px-2 py-1 font-ui text-[11px] transition-colors",
                view === "code"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Code2Icon size={10} />
              <span>Code</span>
            </button>
          </div>

          {/* Actions */}
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 rounded px-1.5 py-0.5 font-ui text-[11px] text-muted-foreground transition-colors hover:bg-border/50 hover:text-foreground"
            aria-label={isCopied ? "Copied" : "Copy code"}
          >
            {isCopied ? <CheckIcon size={11} /> : <CopyIcon size={11} />}
          </button>

          {language === "html" && (
            <button
              onClick={handleOpenInNewTab}
              className="flex items-center gap-1 rounded px-1.5 py-0.5 font-ui text-[11px] text-muted-foreground transition-colors hover:bg-border/50 hover:text-foreground"
              aria-label="Open in new tab"
            >
              <ExternalLinkIcon size={11} />
            </button>
          )}

          <button
            onClick={() => setIsExpanded((e) => !e)}
            className="flex items-center gap-1 rounded px-1.5 py-0.5 font-ui text-[11px] text-muted-foreground transition-colors hover:bg-border/50 hover:text-foreground"
            aria-label={isExpanded ? "Collapse" : "Expand"}
          >
            <MaximizeIcon size={11} />
          </button>
        </div>
      </div>

      {/* Content */}
      {view === "preview" ? (
        <div
          className={cn(
            "bg-white",
            isExpanded ? "h-[calc(100vh-8rem)]" : "h-80",
          )}
        >
          <iframe
            srcDoc={code}
            sandbox="allow-scripts allow-same-origin allow-forms"
            className="h-full w-full border-none"
            title={displayTitle}
          />
        </div>
      ) : (
        <div className={cn(isExpanded ? "max-h-[calc(100vh-8rem)] overflow-y-auto" : "")}>
          <ShikiCodeBlock
            code={code}
            language={language}
            className="rounded-none border-none"
          />
        </div>
      )}

      {/* Expand backdrop */}
      {isExpanded && (
        <div
          className="fixed inset-0 -z-10 bg-background/80 backdrop-blur-xs"
          onClick={() => setIsExpanded(false)}
        />
      )}
    </div>
  );
};
