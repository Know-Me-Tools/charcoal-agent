import type { ComponentProps } from "react";
import type { MarkdownTextPrimitive } from "@assistant-ui/react-markdown";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
import { MARKDOWN_SANITIZE_SCHEMA } from "./markdown-sanitize-schema";
import { rehypeReplyContentPolicy } from "./rehype-reply-content-policy";
import { toCitedUrlSet } from "@/lib/link-policy/cited-web-url";
import { rehypeWebMarkers, type WebCitationHosts } from "./web-citation-markers";

type RehypePlugins = NonNullable<ComponentProps<typeof MarkdownTextPrimitive>["rehypePlugins"]>;

/**
 * The rehype chain `EnhancedMarkdownText` renders every chat message with
 * (the visitor's own messages and the agent's replies alike). Exported from
 * one place so the tests drive this exact list rather than a copy of it.
 *
 * Order matters: rehypeRaw turns embedded raw HTML into real elements first,
 * the sanitizer cleans that (and everything else) second, the reply link and
 * image policy checks destinations on the cleaned tree third, the web marker
 * step marks the `[Wn]` that resolve fourth (it adds only a plain span, after
 * the policy so nothing it makes is policed away; its link, when a citation
 * has a server-minted URL, is built from that frame and never from the reply
 * text), and
 * only then does rehypeKatex generate its own trusted KaTeX markup —
 * sanitizing after KaTeX would strip the very markup it just built.
 */
export type KatexRehypePlugin = RehypePlugins[number];

/**
 * KaTeX (JS and stylesheet) is large and only matters when a message contains
 * math, so it is not imported here: the caller passes the plugin once
 * `markdown-katex.ts` has been loaded. Without it the chain is the same minus
 * the final step (math renders as plain code until KaTeX arrives).
 *
 * `webCitations` maps the message's web citation markers to their host and
 * URL; with none, `[Wn]` stays plain text, and the reply link policy gets the
 * message's cited URLs so a link to one of its own sources is clickable.
 */
export function buildMarkdownRehypePlugins(
  rehypeKatex?: KatexRehypePlugin,
  webCitations?: WebCitationHosts,
): RehypePlugins {
  return [
    rehypeRaw,
    [rehypeSanitize, MARKDOWN_SANITIZE_SCHEMA],
    ...(webCitations && webCitations.size > 0
      ? [[rehypeReplyContentPolicy, { citedUrls: citedUrlsOf(webCitations) }] as RehypePlugins[number]]
      : [rehypeReplyContentPolicy]),
    ...(webCitations && webCitations.size > 0
      ? [[rehypeWebMarkers, { hosts: webCitations }] as RehypePlugins[number]]
      : []),
    ...(rehypeKatex ? [[rehypeKatex, { strict: false }] as RehypePlugins[number]] : []),
  ];
}

function citedUrlsOf(webCitations: WebCitationHosts): ReadonlySet<string> {
  return toCitedUrlSet([...webCitations.values()].map((ref) => ref.url));
}

/** The chain without KaTeX; a stable reference for messages with no math. */
export const MARKDOWN_REHYPE_PLUGINS_NO_MATH: RehypePlugins = buildMarkdownRehypePlugins();
