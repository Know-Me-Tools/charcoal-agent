import type { Element, ElementContent, Root, RootContent, Text } from "hast";
import { policyForVideo } from "./rehype-reply-video-policy";
import { isCitedWebUrl } from "@/lib/link-policy/cited-web-url";
import {
  isAllowedReplyImage,
  isAllowedReplyLink,
  isSameOriginRelative,
} from "@/lib/link-policy/reply-content-policy";

/**
 * Link and image policy for chat messages (site-reply-content-hardening 3.2),
 * run after the sanitizer so it sees the cleaned tree from both markdown and
 * raw HTML. The sanitizer only checks schemes; this checks destinations:
 *
 *   - `<img>` loads only from the site's own hosts or a same-origin path.
 *     A blocked image is replaced by its alt text, because a remote image
 *     fires a request the moment it renders.
 *   - `<source srcset>` (inside `<picture>`, allowed by the default schema)
 *     is dropped unless every candidate passes the same image rule.
 *   - `<video>` is rebuilt from an allowlist by `rehype-reply-video-policy`.
 *   - `<a href>` stays a link only for the explicit reviewed destinations
 *     (and same-page anchors such as footnotes); an allowed external link
 *     opens in a new tab with `noopener noreferrer`. Any other link becomes
 *     its own text followed by the destination in parentheses, the way
 *     citation cards show a non-allowlisted URL, and is shown once when the
 *     text already is the destination (autolinked URLs and emails).
 *   - A link to a URL in `citedUrls` (the message's own web citations, minted
 *     by the server) is also allowed: the model cannot make an arbitrary
 *     destination clickable, but it can link a source the search returned.
 */
export interface ReplyContentPolicyOptions {
  citedUrls?: ReadonlySet<string>;
}

const NO_CITED_URLS: ReadonlySet<string> = new Set();

export function rehypeReplyContentPolicy(options: ReplyContentPolicyOptions = {}) {
  const cited = options.citedUrls ?? NO_CITED_URLS;
  return (tree: Root) => {
    tree.children = tree.children.flatMap<RootContent>((node) =>
      node.type === "element" ? applyPolicy(node, cited) : [node],
    );
  };
}

function applyPolicy(node: Element, cited: ReadonlySet<string>): ElementContent[] {
  // A video is rebuilt from its original children (its sources need their
  // `src` and `type`), so it never goes through the generic child pass.
  if (node.tagName === "video") return policyForVideo(node);

  const children = node.children.flatMap((child) =>
    child.type === "element" ? applyPolicy(child, cited) : [child],
  );

  switch (node.tagName) {
    case "img":
      return policyForImage(node);
    case "source": {
      // `src`/`type` are for `<video>` only (policyForVideo reads them from the
      // original tree); a picture `<source>` keeps just its checked srcset.
      const { src: _src, type: _type, ...rest } = node.properties;
      return isAllowedSrcSet(node.properties.srcSet)
        ? [{ ...node, properties: rest, children }]
        : [];
    }
    case "a":
      return policyForLink(node, children, cited);
    default:
      return [{ ...node, children }];
  }
}

function policyForImage(node: Element): ElementContent[] {
  const src = node.properties.src;
  if (typeof src === "string" && isAllowedReplyImage(src)) return [node];
  const alt = node.properties.alt;
  return typeof alt === "string" && alt.trim() !== "" ? [text(alt)] : [];
}

/** hast keeps `srcSet` as a list of "url descriptor" candidates. */
function isAllowedSrcSet(srcSet: unknown): boolean {
  if (srcSet === undefined || srcSet === null) return true;
  const candidates = Array.isArray(srcSet) ? srcSet.map(String) : String(srcSet).split(",");
  return candidates.every((candidate) => {
    const url = candidate.trim().split(/\s+/)[0] ?? "";
    return url === "" || isAllowedReplyImage(url);
  });
}

function policyForLink(
  node: Element,
  children: ElementContent[],
  cited: ReadonlySet<string>,
): ElementContent[] {
  const href = node.properties.href;
  if (typeof href !== "string") return [{ ...node, children }];

  if (isAllowedReplyLink(href) || isCitedWebUrl(href, cited)) {
    if (isSameOriginRelative(href)) return [{ ...node, children }];
    return [
      {
        ...node,
        properties: { ...node.properties, target: "_blank", rel: ["noopener", "noreferrer"] },
        children,
      },
    ];
  }

  const label = textOf(children).trim();
  const destination = href.trim();
  if (destination === "" || label === destination || label === destination.replace(/^mailto:/i, "")) {
    return children;
  }
  return [...children, text(` (${destination})`)];
}

function textOf(nodes: ElementContent[]): string {
  return nodes
    .map((node) => {
      if (node.type === "text") return node.value;
      if (node.type === "element") return textOf(node.children);
      return "";
    })
    .join("");
}

function text(value: string): Text {
  return { type: "text", value };
}
