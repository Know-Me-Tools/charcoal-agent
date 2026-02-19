import { useState, useEffect, type FC } from "react";
import type { Highlighter } from "shiki";
import { CheckIcon, CopyIcon } from "lucide-react";
import { cn } from "@/lib/utils";

// Lazy singleton highlighter
let highlighterPromise: Promise<Highlighter> | null = null;

function getHighlighter(): Promise<Highlighter> {
  if (!highlighterPromise) {
    highlighterPromise = import("shiki").then(({ createHighlighter }) =>
      createHighlighter({
        themes: ["github-dark-dimmed", "github-light"],
        langs: [
          "typescript",
          "javascript",
          "tsx",
          "jsx",
          "python",
          "rust",
          "go",
          "java",
          "css",
          "html",
          "json",
          "yaml",
          "toml",
          "bash",
          "sh",
          "sql",
          "markdown",
          "text",
          "plaintext",
        ],
      }),
    );
  }
  return highlighterPromise;
}

interface ShikiCodeBlockProps {
  code: string;
  language?: string;
  showLineNumbers?: boolean;
  className?: string;
}

export const ShikiCodeBlock: FC<ShikiCodeBlockProps> = ({
  code,
  language = "text",
  showLineNumbers = false,
  className,
}) => {
  const [highlightedHtml, setHighlightedHtml] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;

    getHighlighter()
      .then((hl) => {
        // Use a safe language name — shiki returns empty string for unknown langs
        const safeLanguage = hl.getLoadedLanguages().includes(language)
          ? language
          : "text";

        // Detect dark/light from document
        const isDark = document.documentElement.classList.contains("dark");
        const theme = isDark ? "github-dark-dimmed" : "github-light";

        const html = hl.codeToHtml(code, {
          lang: safeLanguage,
          theme,
          transformers: showLineNumbers
            ? [
                {
                  line(node, line) {
                    node.properties["data-line"] = line;
                  },
                },
              ]
            : [],
        });

        if (!cancelled) setHighlightedHtml(html);
      })
      .catch(() => {
        if (!cancelled) setHighlightedHtml(null);
      });

    return () => {
      cancelled = true;
    };
  }, [code, language, showLineNumbers]);

  const handleCopy = () => {
    navigator.clipboard.writeText(code).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    });
  };

  return (
    <div className={cn("group relative overflow-hidden rounded-lg border border-border/50", className)}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/50 bg-muted/50 px-3 py-1.5">
        <span className="font-mono text-[11px] text-muted-foreground lowercase">
          {language}
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 rounded px-1.5 py-0.5 font-ui text-[11px] text-muted-foreground transition-colors hover:bg-border/50 hover:text-foreground"
          aria-label={isCopied ? "Copied" : "Copy code"}
        >
          {isCopied ? (
            <>
              <CheckIcon size={11} />
              <span>Copied</span>
            </>
          ) : (
            <>
              <CopyIcon size={11} />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Code */}
      {highlightedHtml ? (
        <div
          className={cn(
            "overflow-x-auto bg-muted/30 p-3 text-xs leading-relaxed [&_pre]:!bg-transparent [&_pre]:!p-0",
            showLineNumbers &&
              "[&_.line]:relative [&_.line]:pl-10 [&_.line]:before:absolute [&_.line]:before:left-0 [&_.line]:before:w-8 [&_.line]:before:text-right [&_.line]:before:text-muted-foreground/50 [&_.line]:before:content-[attr(data-line)]",
          )}
          dangerouslySetInnerHTML={{ __html: highlightedHtml }}
        />
      ) : (
        <pre className="overflow-x-auto bg-muted/30 p-3 font-mono text-xs leading-relaxed text-foreground">
          <code>{code}</code>
        </pre>
      )}
    </div>
  );
};
