import type { ComponentProps } from "react";
import type { MarkdownTextPrimitive } from "@assistant-ui/react-markdown";
import rehypeKatex from "rehype-katex";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
import { MARKDOWN_SANITIZE_SCHEMA } from "./markdown-sanitize-schema";
import { rehypeReplyContentPolicy } from "./rehype-reply-content-policy";

type RehypePlugins = NonNullable<ComponentProps<typeof MarkdownTextPrimitive>["rehypePlugins"]>;

/**
 * The rehype chain `EnhancedMarkdownText` renders every chat message with
 * (the visitor's own messages and the agent's replies alike). Exported from
 * one place so the tests drive this exact list rather than a copy of it.
 *
 * Order matters: rehypeRaw turns embedded raw HTML into real elements first,
 * the sanitizer cleans that (and everything else) second, the reply link and
 * image policy checks destinations on the cleaned tree third, and only then
 * does rehypeKatex generate its own trusted KaTeX markup — sanitizing after KaTeX
 * would strip the very markup it just built.
 */
export const MARKDOWN_REHYPE_PLUGINS: RehypePlugins = [
  rehypeRaw,
  [rehypeSanitize, MARKDOWN_SANITIZE_SCHEMA],
  rehypeReplyContentPolicy,
  [rehypeKatex, { strict: false }],
];
