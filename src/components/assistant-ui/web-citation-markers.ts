import type { Element, ElementContent, Root, RootContent, Text } from "hast";
import { WEB_SEARCH_CONTENT } from "../../../content/site/web-search";
import { CITATIONS_PART } from "@/features/chat/render-registry/pseudo-parts";
import { EXTERNAL_LINK_PROPS, normalizeHttpsUrl } from "@/lib/link-policy/cited-web-url";

/**
 * `[Wn]` in a reply (site-web-search 16.8.2). A marker resolves only when the
 * same message carries a web citation with that marker. A resolved marker is
 * a link to the server-minted URL of that citation, opening in a new tab
 * (operator request 2026-10-14); when the citation has no usable URL it is a
 * small non-interactive element naming the host. An unresolved `[Wn]` is left
 * exactly as the model wrote it, plain text. The link target never comes
 * from the reply text: only from the message's own citation frame.
 */

/** One web citation of a message: its host and, when usable, its URL. */
export interface WebCitationRef {
  host: string;
  /** A plain https URL with no userinfo, normalized; absent when the frame had none. */
  url?: string;
}

/** marker -> citation, for the web citations in one message. */
export type WebCitationHosts = ReadonlyMap<number, WebCitationRef>;

const NO_HOSTS: WebCitationHosts = new Map();

/** The slice of an assistant-ui message part this module reads. */
interface PartLike {
  type?: string;
  toolName?: string;
  args?: { citations?: Array<{ index?: number; origin?: string; host?: string; url?: string }> };
}

/** Web citations of a message, read from its Sources pseudo-part(s). */
export function webCitationHostsFromParts(parts: readonly unknown[]): Map<number, WebCitationRef> {
  const hosts = new Map<number, WebCitationRef>();
  for (const part of parts as PartLike[]) {
    if (part?.type !== "tool-call" || part.toolName !== CITATIONS_PART) continue;
    for (const c of part.args?.citations ?? []) {
      if (c.origin === "web" && typeof c.index === "number" && typeof c.host === "string" && c.host !== "") {
        const url = typeof c.url === "string" ? normalizeHttpsUrl(c.url) : null;
        hosts.set(c.index, url === null ? { host: c.host } : { host: c.host, url });
      }
    }
  }
  return hosts;
}

/** A primitive, equality-stable form of the hosts, safe to select from a store. */
export function encodeWebCitationHosts(hosts: ReadonlyMap<number, WebCitationRef>): string {
  return hosts.size === 0 ? "" : JSON.stringify([...hosts]);
}

export function decodeWebCitationHosts(encoded: string): WebCitationHosts {
  if (encoded === "") return NO_HOSTS;
  try {
    return new Map(JSON.parse(encoded) as Array<[number, WebCitationRef]>);
  } catch {
    return NO_HOSTS;
  }
}

const MARKER = /\[W([1-9]\d*)\]/g;
/** Elements whose text is never a citation marker. */
const SKIP = new Set(["code", "pre", "a", "script", "style"]);

const MARKER_CLASS = ["font-mono", "text-xs", "font-semibold", "text-cyan-text"];
const MARKER_LINK_CLASS = [
  ...MARKER_CLASS,
  "rounded-sm",
  "underline",
  "underline-offset-2",
  "hover:bg-hover",
  "focus-cue",
];

function markerElement(marker: number, ref: WebCitationRef): Element {
  const title = WEB_SEARCH_CONTENT.markerTitle.replace("{host}", ref.host);
  const label: ElementContent = { type: "text", value: `[W${marker}]` };
  if (ref.url === undefined) {
    return {
      type: "element",
      tagName: "span",
      properties: { dataWebMarker: String(marker), title, className: MARKER_CLASS },
      children: [label],
    };
  }
  return {
    type: "element",
    tagName: "a",
    properties: {
      href: ref.url,
      target: EXTERNAL_LINK_PROPS.target,
      rel: ["noopener", "noreferrer"],
      dataWebMarker: String(marker),
      title,
      ariaLabel: `Source W${marker}, ${ref.host}, opens in a new tab`,
      className: MARKER_LINK_CLASS,
    },
    children: [label],
  };
}

function splitText(node: Text, hosts: WebCitationHosts): ElementContent[] {
  const out: ElementContent[] = [];
  let last = 0;
  for (const match of node.value.matchAll(MARKER)) {
    const marker = Number(match[1]);
    const ref = hosts.get(marker);
    if (ref === undefined) continue; // unresolved: stays in the surrounding text
    const at = match.index ?? 0;
    if (at > last) out.push({ type: "text", value: node.value.slice(last, at) });
    out.push(markerElement(marker, ref));
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
