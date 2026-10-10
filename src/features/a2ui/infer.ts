import { A2UI_WIRE_VERSION, UAR_A2UI_CATALOG_ID } from "./carrier-adapter";

/**
 * Deterministic A2UI inference (change agui-inferred-a2ui).
 *
 * Turns a JSON value with no registered template into an A2UI v0.9.1 surface
 * built from the catalog's nine components only: a Card holding a Column of
 * label/value rows, with a nested object becoming a heading and a Column of
 * its own. Identical input gives identical output (ids come from a depth-first
 * counter; keys keep their JSON order).
 *
 * Agent text only ever lands in a literal `text` string, which the catalog's
 * Text renders as plain text, never as Markdown or HTML, so it is escaped by
 * construction. Bindings, function calls and actions are never generated.
 *
 * Anything over a cap is refused rather than clipped, and the caller keeps
 * its existing view: inference is a nicer display of the same data, not a
 * reason to lose it.
 */

/** Most nested objects below the root (the root is depth 0). */
export const INFER_MAX_DEPTH = 3;
/** Most entries (object fields plus array items) rendered in one surface. */
export const INFER_MAX_ENTRIES = 40;
/** Largest serialized input, in bytes. */
export const INFER_MAX_INPUT_BYTES = 8 * 1024;
/** Longest rendered string; longer strings are refused, not truncated. */
export const INFER_MAX_STRING_CHARS = 500;
/** Most scalars joined into one line for an array of scalars. */
export const INFER_MAX_SCALARS_PER_LINE = 20;

export type InferResult =
  | { ok: true; content: string }
  | { ok: false; reason: "unsupported" | "too_large" | "too_deep" | "too_long" };

type Component = Record<string, unknown>;

class Refusal extends Error {
  constructor(readonly reason: Exclude<InferResult, { ok: true }>["reason"]) {
    super(reason);
  }
}

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

const isScalar = (v: unknown): v is string | number | boolean | null =>
  v === null || ["string", "number", "boolean"].includes(typeof v);

function scalarText(v: string | number | boolean | null): string {
  if (v === null) return "—";
  const text = String(v);
  if (text.length > INFER_MAX_STRING_CHARS) throw new Refusal("too_long");
  return text;
}

interface Builder {
  components: Component[];
  entries: number;
  next: number;
}

function id(b: Builder): string {
  return `n${b.next++}`;
}

function text(b: Builder, value: string, variant?: string): string {
  const nodeId = id(b);
  b.components.push({
    id: nodeId,
    component: "Text",
    text: value,
    ...(variant ? { variant } : {}),
  });
  return nodeId;
}

function spend(b: Builder, count = 1): void {
  b.entries += count;
  if (b.entries > INFER_MAX_ENTRIES) throw new Refusal("too_large");
}

function row(b: Builder, label: string, value: string): string {
  const rowId = id(b);
  const children = [text(b, label, "caption"), text(b, value)];
  b.components.push({ id: rowId, component: "Row", children, justify: "spaceBetween" });
  return rowId;
}

function column(b: Builder, children: string[]): string {
  const colId = id(b);
  b.components.push({ id: colId, component: "Column", children });
  return colId;
}

/** One object's fields as row ids, recursing into nested objects and arrays. */
function fields(b: Builder, obj: Record<string, unknown>, depth: number): string[] {
  const out: string[] = [];
  for (const [key, value] of Object.entries(obj)) {
    spend(b);
    out.push(entry(b, key, value, depth));
  }
  return out;
}

function entry(b: Builder, key: string, value: unknown, depth: number): string {
  if (isScalar(value)) return row(b, key, scalarText(value));

  if (Array.isArray(value)) {
    if (value.every(isScalar)) {
      if (value.length > INFER_MAX_SCALARS_PER_LINE) throw new Refusal("too_large");
      return row(b, key, value.map(scalarText).join(", ") || "—");
    }
    return group(
      b,
      key,
      value.map((item, index) => [`${index + 1}`, item] as const),
      depth,
    );
  }

  if (isRecord(value)) return group(b, key, Object.entries(value), depth);
  throw new Refusal("unsupported");
}

/** A heading with a Column of nested entries. */
function group(
  b: Builder,
  title: string,
  items: ReadonlyArray<readonly [string, unknown]>,
  depth: number,
): string {
  if (depth + 1 > INFER_MAX_DEPTH) throw new Refusal("too_deep");
  const heading = text(b, title, "h5");
  const children = items.map(([key, value]) => {
    spend(b);
    return entry(b, key, value, depth + 1);
  });
  return column(b, [heading, ...children]);
}

/**
 * A surface for a JSON object, or a refusal. `title` becomes the heading.
 * Arrays and scalars at the root are unsupported: there is no field to label.
 */
export function inferA2uiFromValue(value: unknown, options: { title?: string } = {}): InferResult {
  if (!isRecord(value)) return { ok: false, reason: "unsupported" };

  let serialized: string;
  try {
    serialized = JSON.stringify(value);
  } catch {
    return { ok: false, reason: "unsupported" };
  }
  if (new TextEncoder().encode(serialized).length > INFER_MAX_INPUT_BYTES) {
    return { ok: false, reason: "too_large" };
  }

  const b: Builder = { components: [], entries: 0, next: 0 };
  try {
    const body: string[] = [];
    if (options.title) body.push(text(b, options.title, "h5"));
    body.push(...fields(b, value, 0));
    if (body.length === 0) return { ok: false, reason: "unsupported" };
    const bodyId = column(b, body);
    b.components.push({ id: "root", component: "Card", child: bodyId });
  } catch (error) {
    if (error instanceof Refusal) return { ok: false, reason: error.reason };
    throw error;
  }

  const surfaceId = "inferred";
  const content = [
    {
      version: A2UI_WIRE_VERSION,
      createSurface: { surfaceId, catalogId: UAR_A2UI_CATALOG_ID },
    },
    {
      version: A2UI_WIRE_VERSION,
      updateComponents: { surfaceId, components: b.components },
    },
  ]
    .map((m) => JSON.stringify(m))
    .join("\n");
  return { ok: true, content };
}

/** Infers from a JSON string (a tool result or artifact content). */
export function inferA2uiFromJson(json: string, options: { title?: string } = {}): InferResult {
  try {
    return inferA2uiFromValue(JSON.parse(json), options);
  } catch {
    return { ok: false, reason: "unsupported" };
  }
}

/** Warns in development when a result was refused for a cap (not merely unsupported). */
export function noteInferenceFallback(result: InferResult): void {
  if ("reason" in result && result.reason !== "unsupported") warnInferenceFallback(result.reason);
}

const warned = new Set<string>();

/** Development-only warning, once per reason, when inference falls back. */
export function warnInferenceFallback(reason: string): void {
  if (!import.meta.env.DEV || warned.has(reason)) return;
  warned.add(reason);
  console.warn(`[a2ui-inference] Falling back to the existing view: ${reason}.`);
}
