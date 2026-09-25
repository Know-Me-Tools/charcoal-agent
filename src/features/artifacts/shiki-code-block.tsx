import { useState, useEffect, type FC } from "react";
import type { Highlighter } from "shiki";
import { CheckIcon, CopyIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUiStore } from "@/stores/ui-store";

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
  /** Margin only — callers must not pass sizing or outline overrides (design spec §7.7). */
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

  // Re-highlight when the theme changes.
  const theme = useUiStore((s) => s.theme);

  useEffect(() => {
    let cancelled = false;

    getHighlighter()
      .then((hl) => {
        // Use a safe language name — shiki returns empty string for unknown langs
        const safeLanguage = hl.getLoadedLanguages().includes(language)
          ? language
          : "text";

        const shikiTheme = theme === "dark" ? "github-dark-dimmed" : "github-light";

        const html = hl.codeToHtml(code, {
          lang: safeLanguage,
          theme: shikiTheme,
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
  }, [code, language, showLineNumbers, theme]);

  const handleCopy = () => {
    navigator.clipboard.writeText(code).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    });
  };

  return (
    <div className={cn("group relative my-3 first:mt-0 last:mb-0 min-w-0 overflow-hidden rounded-lg bg-code", className)}>
      {/* Header */}
      <div className="flex items-center justify-between gap-2 bg-raised px-3 py-1.5">
        <span className="font-mono text-xs text-fg-secondary lowercase">{language}</span>
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1 rounded-sm px-2 py-1 font-ui text-xs font-semibold text-fg-secondary transition-hover hover:bg-hover hover:text-fg focus-cue"
        >
          {isCopied ? (
            <CheckIcon className="size-3.5" aria-hidden="true" />
          ) : (
            <CopyIcon className="size-3.5" aria-hidden="true" />
          )}
          <span aria-live="polite">{isCopied ? "Copied" : "Copy"}</span>
        </button>
      </div>

      {/* Code — the Shiki theme's own background is always overridden by bg-code. */}
      <div
        tabIndex={0}
        role="region"
        aria-label={`${language} code`}
        className={cn(
          "overflow-x-auto bg-code p-3 font-mono text-xs leading-relaxed text-fg focus-cue [&_pre]:bg-transparent! [&_pre]:p-0!",
          showLineNumbers &&
            "[&_.line]:relative [&_.line]:pl-10 [&_.line]:before:absolute [&_.line]:before:left-0 [&_.line]:before:w-8 [&_.line]:before:text-right [&_.line]:before:text-faint [&_.line]:before:content-[attr(data-line)]",
        )}
      >
        {highlightedHtml ? (
          // biome-ignore lint/security/noDangerouslySetInnerHtml: Shiki output is generated locally from the code string
          <div dangerouslySetInnerHTML={{ __html: highlightedHtml }} />
        ) : (
          <pre className="m-0 bg-transparent p-0">
            <code>{code}</code>
          </pre>
        )}
      </div>
    </div>
  );
};
