import {
  MarkdownTextPrimitive,
  unstable_memoizeMarkdownComponents as memoizeMarkdownComponents,
  useIsMarkdownCodeBlock,
} from "@assistant-ui/react-markdown";
import { useAuiState, useMessagePartText } from "@assistant-ui/react";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import { type FC, memo, useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { MermaidBlock } from "@/features/artifacts/mermaid-block";
import { HtmlArtifactCard } from "@/features/artifacts/html-artifact-card";
import { ShikiCodeBlock } from "@/features/artifacts/shiki-code-block";
import {
  buildMarkdownRehypePlugins,
  MARKDOWN_REHYPE_PLUGINS_NO_MATH,
  type KatexRehypePlugin,
} from "./markdown-rehype-plugins";
import {
  decodeWebCitationHosts,
  encodeWebCitationHosts,
  webCitationHostsFromParts,
} from "./web-citation-markers";

import "@assistant-ui/react-markdown/styles/dot.css";

// Inline code
const InlineCode: FC<React.HTMLAttributes<HTMLElement>> = ({
  className,
  ...props
}) => (
  <code
    className={cn(
      "rounded-sm bg-muted-surface px-1.5 py-0.5 font-mono text-[0.875em] text-fg",
      className,
    )}
    {...props}
  />
);

// Smart code block dispatcher — routes by language
export const EnhancedCodeBlock: FC<
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
        "mt-6 mb-2 max-w-[68ch] first:mt-0 font-display font-semibold tracking-tight text-fg text-xl",
        className,
      )}
      {...props}
    />
  ),
  h2: ({ className, ...props }) => (
    <h2
      className={cn(
        "mt-6 mb-2 max-w-[68ch] first:mt-0 font-display font-semibold tracking-tight text-fg text-lg",
        className,
      )}
      {...props}
    />
  ),
  h3: ({ className, ...props }) => (
    <h3
      className={cn(
        "mt-6 mb-2 max-w-[68ch] first:mt-0 font-display font-semibold tracking-tight text-fg text-base",
        className,
      )}
      {...props}
    />
  ),
  h4: ({ className, ...props }) => (
    <h4
      className={cn(
        "mt-6 mb-2 max-w-[68ch] first:mt-0 font-display font-semibold tracking-tight text-fg text-sm",
        className,
      )}
      {...props}
    />
  ),
  h5: ({ className, ...props }) => (
    <h5
      className={cn(
        "mt-6 mb-2 max-w-[68ch] first:mt-0 font-display font-semibold tracking-tight text-fg text-sm",
        className,
      )}
      {...props}
    />
  ),
  h6: ({ className, ...props }) => (
    <h6
      className={cn(
        "mt-6 mb-2 max-w-[68ch] first:mt-0 font-display font-semibold tracking-tight text-fg text-sm",
        className,
      )}
      {...props}
    />
  ),

  // Body
  p: ({ className, ...props }) => (
    <p
      className={cn("my-3 max-w-[68ch] first:mt-0 last:mb-0", className)}
      {...props}
    />
  ),
  a: ({ className, ...props }) => (
    <a
      className={cn(
        "rounded-sm text-ember-text underline underline-offset-2 wrap-anywhere hover:text-fg focus-cue",
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
        "my-3 max-w-[68ch] rounded-md bg-surface px-4 py-2 text-fg-secondary",
        className,
      )}
      {...props}
    />
  ),

  // Lists
  ul: ({ className, ...props }) => (
    <ul
      className={cn(
        "my-3 ms-5 max-w-[68ch] list-disc marker:text-faint [&>li]:mt-1",
        className,
      )}
      {...props}
    />
  ),
  ol: ({ className, ...props }) => (
    <ol
      className={cn(
        "my-3 ms-5 max-w-[68ch] list-decimal marker:text-faint [&>li]:mt-1",
        className,
      )}
      {...props}
    />
  ),

  // Tables
  table: ({ className, ...props }) => (
    <div
      className="my-3 overflow-x-auto rounded-lg bg-surface focus-cue"
      tabIndex={0}
      role="region"
      aria-label="Table"
    >
      <table
        className={cn("w-full border-separate border-spacing-0 text-sm", className)}
        {...props}
      />
    </div>
  ),
  th: ({ className, ...props }) => (
    <th
      className={cn(
        "bg-raised px-3 py-2 text-start font-ui text-xs font-semibold text-fg-secondary",
        className,
      )}
      {...props}
    />
  ),
  td: ({ className, ...props }) => (
    <td
      className={cn(
        "px-3 py-2 text-start align-top text-fg [[align=center]]:text-center [[align=right]]:text-right",
        className,
      )}
      {...props}
    />
  ),
  tr: ({ className, ...props }) => (
    <tr className={cn("even:bg-muted-surface", className)} {...props} />
  ),

  // Misc
  hr: ({ className, ...props }) => (
    <hr className={cn("my-6 h-0 border-0 bg-transparent", className)} {...props} />
  ),
  sup: ({ className, ...props }) => (
    <sup
      className={cn(
        "[&>a]:font-mono [&>a]:text-xs [&>a]:text-cyan-text [&>a]:no-underline",
        className,
      )}
      {...props}
    />
  ),
  img: ({ className, ...props }) => (
    <img
      className={cn("my-3 h-auto max-w-full rounded-lg bg-muted-surface", className)}
      loading="lazy"
      decoding="async"
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

let katexPlugin: KatexRehypePlugin | null = null;
let katexLoad: Promise<KatexRehypePlugin> | null = null;

function loadKatexPlugin(): Promise<KatexRehypePlugin> {
  katexLoad ??= import("./markdown-katex").then((m) => (katexPlugin = m.rehypeKatex));
  return katexLoad;
}

/**
 * The KaTeX rehype plugin once it has loaded, fetched only the first time a
 * message contains `$` (remark-math's only trigger). Until then math renders as
 * plain code, then re-renders typeset when the chunk arrives.
 */
function useKatexPlugin(text: string): KatexRehypePlugin | null {
  const needed = text.includes("$");
  const [plugin, setPlugin] = useState<KatexRehypePlugin | null>(katexPlugin);
  useEffect(() => {
    if (!needed || plugin) return;
    let live = true;
    loadKatexPlugin().then(
      (p) => live && setPlugin(() => p),
      (err) => console.error("[markdown] KaTeX failed to load", err),
    );
    return () => {
      live = false;
    };
  }, [needed, plugin]);
  return needed ? plugin : null;
}

const EnhancedMarkdownTextImpl = () => {
  const { text } = useMessagePartText();
  const katex = useKatexPlugin(text);
  // The message's web citations, as a primitive so the selector is stable.
  const webHostsKey = useAuiState((s) => encodeWebCitationHosts(webCitationHostsFromParts(s.message.content)));
  // Raw HTML -> sanitizer -> reply link/image policy -> `[Wn]` markers ->
  // KaTeX; the order and the reasons for it are documented on
  // `buildMarkdownRehypePlugins`.
  const rehypePlugins = useMemo(() => {
    if (!katex && webHostsKey === "") return MARKDOWN_REHYPE_PLUGINS_NO_MATH;
    return buildMarkdownRehypePlugins(katex ?? undefined, decodeWebCitationHosts(webHostsKey));
  }, [katex, webHostsKey]);
  return (
    <MarkdownTextPrimitive
      remarkPlugins={[remarkGfm, remarkMath]}
      rehypePlugins={rehypePlugins}
      className="aui-md max-w-none wrap-break-word text-fg data-[status=running]:**:after:text-cyan"
      components={enhancedComponents}
    />
  );
};

export const EnhancedMarkdownText = memo(EnhancedMarkdownTextImpl);
