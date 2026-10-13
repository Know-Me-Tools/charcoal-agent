import type { Element, ElementContent, Root, RootContent, Text } from "hast";
import { WEB_SEARCH_CONTENT } from "../../../content/site/web-search";
import { CITATIONS_PART } from "@/features/chat/render-registry/pseudo-parts";

/**
 * `[Wn]` in a reply (site-web-search 16.8.2). A marker resolves only when the
 * same message carries a web citation with that marker; resolved markers get
 * a small non-interactive element naming the source host, and an unresolved
 * `[Wn]` is left exactly as the model wrote it, plain text. Nothing here ever
 * creates a link: the destination of a web source is shown in the Sources
 * block, under the reply link allowlist.
 */

/** marker -> host, for the web citations in one message. */
export type WebCitationHosts = ReadonlyMap<number, string>;

const NO_HOSTS: WebCitationHosts = new Map();

/** The slice of an assistant-ui message part this module reads. */
interface PartLike {
  type?: string;
  toolName?: string;
  args?: { citations?: Array<{ index?: number; origin?: string; host?: string }> };
}

/** Web citations of a message, read from its Sources pseudo-part(s). */
export function webCitationHostsFromParts(parts: readonly unknown[]): Map<number, string> {
  const hosts = new Map<number, string>();
  for (const part of parts as PartLike[]) {
    if (part?.type !== "tool-call" || part.toolName !== CITATIONS_PART) continue;
    for (const c of part.args?.citations ?? []) {
      if (c.origin === "web" && typeof c.index === "number" && typeof c.host === "string" && c.host !== "") {
        hosts.set(c.index, c.host);
      }
    }
  }
  return hosts;
}

/** A primitive, equality-stable form of the hosts, safe to select from a store. */
export function encodeWebCitationHosts(hosts: ReadonlyMap<number, string>): string {
  return hosts.size === 0 ? "" : JSON.stringify([...hosts]);
}

export function decodeWebCitationHosts(encoded: string): WebCitationHosts {
  if (encoded === "") return NO_HOSTS;
  try {
    return new Map(JSON.parse(encoded) as Array<[number, string]>);
  } catch {
    return NO_HOSTS;
  }
}

const MARKER = /\[W([1-9]\d*)\]/g;
/** Elements whose text is never a citation marker. */
const SKIP = new Set(["code", "pre", "a", "script", "style"]);

function markerElement(marker: number, host: string): Element {
  return {
    type: "element",
    tagName: "span",
    properties: {
      dataWebMarker: String(marker),
      title: WEB_SEARCH_CONTENT.markerTitle.replace("{host}", host),
      className: ["font-mono", "text-xs", "font-semibold", "text-cyan-text"],
    },
    children: [{ type: "text", value: `[W${marker}]` }],
  };
}

function splitText(node: Text, hosts: WebCitationHosts): ElementContent[] {
  const out: ElementContent[] = [];
  let last = 0;
  for (const match of node.value.matchAll(MARKER)) {
    const marker = Number(match[1]);
    const host = hosts.get(marker);
    if (host === undefined) continue; // unresolved: stays in the surrounding text
    const at = match.index ?? 0;
    if (at > last) out.push({ type: "text", value: node.value.slice(last, at) });
    out.push(markerElement(marker, host));
    last = at + match[0].length;
  }
  if (last === 0) return [node];
  if (last < node.value.length) out.push({ type: "text", value: node.value.slice(last) });
  return out;
}

function walk(children: ElementContent[], hosts: WebCitationHosts): ElementContent[] {
  return children.flatMap((child) => {
    if (child.type === "text") return splitText(child, hosts);
    if (child.type === "element" && !SKIP.has(child.tagName)) {
      return [{ ...child, children: walk(child.children, hosts) }];
    }
    return [child];
  });
}

export interface RehypeWebMarkersOptions {
  hosts: WebCitationHosts;
}

export function rehypeWebMarkers(options: RehypeWebMarkersOptions) {
  return (tree: Root) => {
    if (options.hosts.size === 0) return;
    tree.children = tree.children.flatMap<RootContent>((node) => {
      if (node.type === "text") return splitText(node, options.hosts);
      if (node.type === "element" && !SKIP.has(node.tagName)) {
        return [{ ...node, children: walk(node.children, options.hosts) }];
      }
      return [node];
    });
  };
}
