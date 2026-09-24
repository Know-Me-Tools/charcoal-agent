import {
  MarkdownTextPrimitive,
  unstable_memoizeMarkdownComponents as memoizeMarkdownComponents,
  useIsMarkdownCodeBlock,
} from "@assistant-ui/react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeRaw from "rehype-raw";
import { type FC, memo } from "react";
import { cn } from "@/lib/utils";
import { MermaidBlock } from "@/features/artifacts/mermaid-block";
import { HtmlArtifactCard } from "@/features/artifacts/html-artifact-card";
import { ShikiCodeBlock } from "@/features/artifacts/shiki-code-block";

import "katex/dist/katex.min.css";
import "@assistant-ui/react-markdown/styles/dot.css";

// Inline code — unchanged from original
const InlineCode: FC<React.HTMLAttributes<HTMLElement>> = ({
  className,
  ...props
}) => (
  <code
    className={cn(
      "rounded-md border border-border/50 bg-muted/50 px-1.5 py-0.5 font-mono text-[0.85em]",
      className,
    )}
    {...props}
  />
);

// Smart code block dispatcher — routes by language
const EnhancedCodeBlock: FC<
  React.HTMLAttributes<HTMLElement> & { "data-language"?: string }
> = ({ children, "data-language": language, className, ...props }) => {
  const isCodeBlock = useIsMarkdownCodeBlock();
  const code = typeof children === "string" ? children : String(children ?? "");
  // react-markdown marks fenced code with `className="language-<lang>"`.
  const lang = language ?? /(?:^|\s)language-([\w+#-]+)/.exec(className ?? "")?.[1] ?? "";

  if (!isCodeBlock) {
    return (
      <InlineCode className={className} {...props}>
        {children}
      </InlineCode>
    );
  }

  // Mermaid diagrams
  if (lang === "mermaid") {
    return <MermaidBlock source={code} className="my-3" />;
  }

  // HTML / SVG artifacts — only for non-trivial content
  if ((lang === "html" || lang === "svg") && code.trim().length > 100) {
    return (
      <HtmlArtifactCard
        code={code}
        language="html"
        className="my-3"
      />
    );
  }

  // TSX/JSX artifacts
  if ((lang === "tsx" || lang === "jsx") && code.trim().length > 200) {
    return (
      <HtmlArtifactCard
        code={code}
        language={lang as "tsx" | "jsx"}
        className="my-3"
      />
    );
  }

  // Default: shiki syntax highlighting
  return (
    <ShikiCodeBlock
      code={code}
      language={lang || "text"}
      className="my-3"
    />
  );
};

const enhancedComponents = memoizeMarkdownComponents({
  // Headings
  h1: ({ className, ...props }) => (
    <h1
      className={cn(
        "mb-2 scroll-m-20 font-display font-semibold text-base first:mt-0 last:mb-0",
        className,
      )}
      {...props}
    />
  ),
  h2: ({ className, ...props }) => (
    <h2
      className={cn(
        "mt-3 mb-1.5 scroll-m-20 font-display font-semibold text-sm first:mt-0 last:mb-0",
        className,
      )}
      {...props}
    />
  ),
  h3: ({ className, ...props }) => (
    <h3
      className={cn(
        "mt-2.5 mb-1 scroll-m-20 font-display font-semibold text-sm first:mt-0 last:mb-0",
        className,
      )}
      {...props}
    />
  ),
  h4: ({ className, ...props }) => (
    <h4
      className={cn(
        "mt-2 mb-1 scroll-m-20 font-display font-medium text-sm first:mt-0 last:mb-0",
        className,
      )}
      {...props}
    />
  ),
  h5: ({ className, ...props }) => (
    <h5
      className={cn(
        "mt-2 mb-1 font-display font-medium text-sm first:mt-0 last:mb-0",
        className,
      )}
      {...props}
    />
  ),
  h6: ({ className, ...props }) => (
    <h6
      className={cn(
        "mt-2 mb-1 font-display font-medium text-sm first:mt-0 last:mb-0",
        className,
      )}
      {...props}
    />
  ),

  // Body
  p: ({ className, ...props }) => (
    <p
      className={cn("my-2.5 leading-relaxed first:mt-0 last:mb-0", className)}
      {...props}
    />
  ),
  a: ({ className, ...props }) => (
    <a
      className={cn(
        "text-ember-text underline underline-offset-2 hover:text-primary/80",
        className,
      )}
      target="_blank"
      rel="noopener noreferrer"
      {...props}
    />
  ),
  blockquote: ({ className, ...props }) => (
    <blockquote
      className={cn(
        "my-2.5 border-l-2 border-primary/30 pl-3 text-muted-foreground italic",
        className,
      )}
      {...props}
    />
  ),

  // Lists
  ul: ({ className, ...props }) => (
    <ul
      className={cn(
        "my-2 ml-4 list-disc marker:text-muted-foreground/60 [&>li]:mt-1",
        className,
      )}
      {...props}
    />
  ),
  ol: ({ className, ...props }) => (
    <ol
      className={cn(
        "my-2 ml-4 list-decimal marker:text-muted-foreground/60 [&>li]:mt-1",
        className,
      )}
      {...props}
    />
  ),
  li: ({ className, ...props }) => (
    <li className={cn("leading-relaxed", className)} {...props} />
  ),

  // Tables
  table: ({ className, ...props }) => (
    <div className="my-3 overflow-x-auto rounded-lg border border-border/50">
      <table
        className={cn("w-full border-separate border-spacing-0", className)}
        {...props}
      />
    </div>
  ),
  th: ({ className, ...props }) => (
    <th
      className={cn(
        "bg-muted/50 px-3 py-2 text-left font-mono text-[11px] font-medium uppercase tracking-widest text-muted-foreground first:rounded-tl-lg last:rounded-tr-lg",
        className,
      )}
      {...props}
    />
  ),
  td: ({ className, ...props }) => (
    <td
      className={cn(
        "border-b border-border/30 px-3 py-2 text-left text-sm last:border-r-0 [[align=center]]:text-center [[align=right]]:text-right",
        className,
      )}
      {...props}
    />
  ),
  tr: ({ className, ...props }) => (
    <tr
      className={cn(
        "transition-colors hover:bg-muted/20 [&:last-child>td]:border-b-0",
        className,
      )}
      {...props}
    />
  ),

  // Misc
  hr: ({ className, ...props }) => (
    <hr
      className={cn("my-4 border-border/30", className)}
      {...props}
    />
  ),
  sup: ({ className, ...props }) => (
    <sup
      className={cn("[&>a]:text-xs [&>a]:no-underline [&>a]:text-ember-text", className)}
      {...props}
    />
  ),

  // Code
  pre: ({ className, ...props }) => (
    <pre
      className={cn("overflow-x-auto", className)}
      {...props}
    />
  ),
  code: EnhancedCodeBlock as typeof InlineCode,
});

const EnhancedMarkdownTextImpl = () => (
  <MarkdownTextPrimitive
    remarkPlugins={[remarkGfm, remarkMath]}
    rehypePlugins={[[rehypeKatex, { strict: false }], rehypeRaw]}
    className="aui-md prose-sm max-w-none text-foreground"
    components={enhancedComponents}
  />
);

export const EnhancedMarkdownText = memo(EnhancedMarkdownTextImpl);
