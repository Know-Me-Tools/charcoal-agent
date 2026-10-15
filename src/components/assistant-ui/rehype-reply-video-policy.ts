import type { Element, ElementContent, Text } from "hast";
import {
  ALLOWED_REPLY_VIDEO_TYPES,
  isAllowedReplyImage,
  isAllowedReplyVideoSrc,
} from "@/lib/link-policy/reply-content-policy";

/**
 * Video policy of the reply content policy (change
 * app-block-copy-and-media-blocks, task 3.5), run at the same point as the
 * image and link policy. The sanitizer has already let a `<video>` and its
 * `<source>` children through by name; this rebuilds every video from an
 * allowlist instead of filtering the model's element:
 *
 *   - a video renders only from `<source>` children whose `src` is https on
 *     the own host or a same-origin path, with `type` video/mp4 or video/webm;
 *   - the output has only `controls`, `preload="none"`, `width`, `height`
 *     (digits) and a `poster` that passes the image rule. Autoplay, loop,
 *     muted, ping and every other attribute never reach the output;
 *   - if any destination (a source, or a `src` on the video itself) is not
 *     allowed, nothing loads: the video becomes plain text that shows the
 *     destination, as a blocked link does;
 *   - a `src` on the video element itself is never rendered, only shown when
 *     remote, so every playable URL has a checked type.
 */

const DIGITS = /^\d{1,4}$/;

export function policyForVideo(node: Element): ElementContent[] {
  const candidates = destinationsOf(node);
  const blocked = candidates.filter((url) => !isAllowedReplyVideoSrc(url));
  const label = fallbackText(node);
  if (blocked.length > 0) {
    return [text(label === "" ? blocked.join(" ") : `${label} (${blocked.join(" ")})`)];
  }

  const sources = sourceElements(node).flatMap<Element>((source) => {
    const src = source.properties.src;
    const type = source.properties.type;
    if (typeof src !== "string" || typeof type !== "string") return [];
    if (!ALLOWED_REPLY_VIDEO_TYPES.has(type.trim().toLowerCase())) return [];
    return [
      {
        type: "element",
        tagName: "source",
        properties: { src, type: type.trim().toLowerCase() },
        children: [],
      },
    ];
  });
  if (sources.length === 0) return label === "" ? [] : [text(label)];

  const properties: Element["properties"] = { controls: true, preload: "none" };
  for (const name of ["width", "height"] as const) {
    const value = String(node.properties[name] ?? "");
    if (DIGITS.test(value)) properties[name] = value;
  }
  const poster = node.properties.poster;
  if (typeof poster === "string" && isAllowedReplyImage(poster)) properties.poster = poster;
  return [{ type: "element", tagName: "video", properties, children: sources }];
}

function sourceElements(node: Element): Element[] {
  return node.children.filter(
    (child): child is Element => child.type === "element" && child.tagName === "source",
  );
}

/** Every destination the model gave: the video's own `src` and each source's. */
function destinationsOf(node: Element): string[] {
  const urls = [node.properties.src, ...sourceElements(node).map((s) => s.properties.src)];
  return urls.flatMap((url) => (typeof url === "string" && url.trim() !== "" ? [url.trim()] : []));
}

/** The text the model put inside the video as fallback content. */
function fallbackText(node: Element): string {
  return node.children
    .flatMap((child) => (child.type === "text" ? [child.value] : []))
    .join("")
    .trim();
}

function text(value: string): Text {
  return { type: "text", value };
}
