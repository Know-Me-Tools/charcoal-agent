import type { Element, Properties } from "hast";
import { describe, expect, it } from "vitest";
import { policyForVideo } from "./rehype-reply-video-policy";

/**
 * Security review L3: calls the policy directly, with no sanitizer in front,
 * so the policy layer's own attribute rebuild is tested on its own. The
 * chain tests in enhanced-markdown-text.video.test.tsx cannot see a
 * regression here because the sanitizer strips the same attributes first.
 */
const OWN = "https://know-me.tools/media/tour.mp4";

function el(tagName: string, properties: Properties, children: Element["children"] = []): Element {
  return { type: "element", tagName, properties, children };
}

function video(properties: Properties, sources: Element[]): Element {
  return el("video", properties, sources);
}

const HOSTILE: Properties = {
  autoPlay: true,
  loop: true,
  muted: true,
  playsInline: true,
  ping: ["https://evil.example/p"],
  className: ["x"],
  style: "a:b",
  onPlay: "alert(1)",
  onerror: "alert(2)",
  srcSet: "https://evil.example/a 1x",
  controls: true,
  preload: "auto",
  width: "640",
  height: "360",
  poster: "https://know-me.tools/p.png",
};

describe("policyForVideo (policy layer alone)", () => {
  it("keeps only controls, preload none, width, height and poster; drops everything else", () => {
    const [out] = policyForVideo(video(HOSTILE, [el("source", { src: OWN, type: "video/mp4" })]));
    expect(out).toMatchObject({ type: "element", tagName: "video" });
    const props = (out as Element).properties;
    expect(props).toEqual({
      controls: true,
      preload: "none",
      width: "640",
      height: "360",
      poster: "https://know-me.tools/p.png",
    });
    for (const name of ["autoPlay", "loop", "muted", "playsInline", "ping", "className", "style", "onPlay", "onerror", "srcSet"]) {
      expect(props, name).not.toHaveProperty(name);
    }
  });

  it("forces preload none even when the model asks for auto or metadata", () => {
    for (const preload of ["auto", "metadata", "none", ""]) {
      const [out] = policyForVideo(video({ preload }, [el("source", { src: OWN, type: "video/mp4" })]));
      expect((out as Element).properties.preload, preload).toBe("none");
    }
  });

  it("drops a poster that fails the image rule and non-digit sizes", () => {
    const [out] = policyForVideo(
      video({ poster: "https://evil.example/p.png", width: "10px", height: "12345" }, [el("source", { src: OWN, type: "video/mp4" })]),
    );
    expect((out as Element).properties).toEqual({ controls: true, preload: "none" });
  });

  it("rebuilds each source with only src and a normalised type", () => {
    const [out] = policyForVideo(
      video({}, [el("source", { src: OWN, type: " VIDEO/MP4 ", srcSet: "x", media: "all", className: ["y"], onerror: "z" })]),
    );
    const sources = (out as Element).children as Element[];
    expect(sources).toHaveLength(1);
    expect(sources[0].properties).toEqual({ src: OWN, type: "video/mp4" });
  });

  it("never copies a src from the video element itself", () => {
    const [out] = policyForVideo(video({ src: "/own.mp4" }, [el("source", { src: OWN, type: "video/mp4" })]));
    expect((out as Element).properties).not.toHaveProperty("src");
  });
});
