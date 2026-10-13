import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { A2uiSurfaceBlock } from "./a2ui-surface-block";
import { readableAnswerCardSource } from "./answer-card-source";

const RAW = "surreal-memory-server-status-and-licence.d372c7887a3d.md";
const READABLE = "Surreal Memory Server status and licence";

type Comp = Record<string, unknown>;

/** The answer card template (uar/presentations/answer-card.json) as NDJSON. */
function card(data: unknown, opts: { path?: string; components?: Comp[] } = {}): string {
  const components = opts.components ?? [
    { id: "root", component: "Card", child: "body" },
    { id: "body", component: "Column", children: ["title", "rule", "summary", "source"] },
    { id: "title", component: "Text", variant: "h3", text: { path: "/title" } },
    { id: "rule", component: "Divider" },
    { id: "summary", component: "Text", variant: "body", text: { path: "/summary" } },
    { id: "source", component: "Text", variant: "caption", text: { path: "/source" } },
  ];
  const update: Record<string, unknown> = { surfaceId: "c", value: data };
  if (opts.path !== undefined) update.path = opts.path;
  return [
    '{"version":"v0.9.1","createSurface":{"surfaceId":"c","catalogId":"urn:uar:a2ui:catalog:1"}}',
    JSON.stringify({ version: "v0.9.1", updateComponents: { surfaceId: "c", components } }),
    JSON.stringify({ version: "v0.9.1", updateDataModel: update }),
  ].join("\n");
}

describe("answer card source line", () => {
  afterEach(cleanup);

  it("shows a raw knowledge-base file name as its readable name", async () => {
    render(<A2uiSurfaceBlock content={card({ title: "T", summary: "S", source: RAW })} passiveOnly />);
    expect(await screen.findByText(READABLE)).toBeTruthy();
    expect(screen.queryByText(RAW)).toBeNull();
  });

  it("cleans a stored-shape card (data at the root path, as persisted threads hold it)", async () => {
    const stored = card({ title: "T", summary: "S", source: RAW }, { path: "/" });
    render(<A2uiSurfaceBlock content={stored} passiveOnly />);
    expect(await screen.findByText(READABLE)).toBeTruthy();
  });

  it("cleans a source sent as its own /source update", async () => {
    render(<A2uiSurfaceBlock content={card(RAW, { path: "/source" })} passiveOnly />);
    expect(await screen.findByText(READABLE)).toBeTruthy();
  });

  it("leaves an already readable source unchanged", async () => {
    render(<A2uiSurfaceBlock content={card({ title: "T", summary: "S", source: READABLE })} passiveOnly />);
    expect(await screen.findByText(READABLE)).toBeTruthy();
  });

  it("leaves a source that is not a .md or hash file name alone", () => {
    expect(readableAnswerCardSource("my-notes")).toBe("my-notes");
    expect(readableAnswerCardSource("Pricing")).toBe("Pricing");
    expect(readableAnswerCardSource(READABLE)).toBe(READABLE);
  });

  it("does not touch title or summary text that looks like a file name", async () => {
    const t = "notes.d372c7887a3d.md";
    const s = "readme.md";
    render(<A2uiSurfaceBlock content={card({ title: t, summary: s, source: RAW })} passiveOnly />);
    expect(await screen.findByText(READABLE)).toBeTruthy();
    expect(screen.getByText(t)).toBeTruthy();
    expect(screen.getByText(s)).toBeTruthy();
  });

  it("does not touch a surface that is not the answer card", async () => {
    const components = [
      { id: "root", component: "Card", child: "body" },
      { id: "body", component: "Column", children: ["source"] },
      { id: "source", component: "Text", text: { path: "/source" } },
    ];
    render(<A2uiSurfaceBlock content={card({ source: RAW }, { components })} passiveOnly />);
    expect(await screen.findByText(RAW)).toBeTruthy();
  });

  it("renders an empty or missing source as before", async () => {
    render(<A2uiSurfaceBlock content={card({ title: "Only title", summary: "S", source: "" })} passiveOnly />);
    expect(await screen.findByText("Only title")).toBeTruthy();
    cleanup();
    render(<A2uiSurfaceBlock content={card({ title: "No source", summary: "S" })} passiveOnly />);
    expect(await screen.findByText("No source")).toBeTruthy();
  });
});
