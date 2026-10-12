// Strict-subset frontmatter parser for the OKF 0.2 knowledge bundle in
// docs/knowledge-source/. No YAML dependency: the bundle only needs the
// fields named in docs/knowledge-source/guides/authoring.md, so this parser
// accepts exactly that shape and reports everything else as an error with a
// line number, instead of guessing.
//
// Accepted grammar (two-space indentation only):
//   key: scalar
//   key: [scalar, scalar]            flow list of scalars (tags only)
//   key:                             followed by an indented block, either
//     sub: scalar                    a map of scalars, or
//     - scalar                       a list of scalars, or
//     - sub: scalar                  a list of maps of scalars
//       sub: scalar
// Scalars: plain, "double quoted" (\" and \\ escapes) or 'single quoted'
// ('' escape). Plain scalars may not contain ": " or " #" and may not start
// with an indicator character. `true`/`false` become booleans and bare
// integers become numbers; everything else stays a string.
// Rejected: comments, anchors, aliases, tags, block scalars (| and >),
// multi-document markers, tabs, and any key the authoring guide does not name.

export const CONCEPT_KEYS = {
  type: "scalar",
  title: "scalar",
  description: "scalar",
  status: "scalar",
  resource: "scalar",
  stale_after: "scalar",
  external_claims: "scalar",
  tags: "scalar-list",
  generated: "map",
  verified: "map-list",
  sources: "map-list",
  usage_window: "scalar",
};

export const SUB_KEYS = {
  generated: ["by", "at"],
  verified: ["by", "at"],
  sources: ["id", "resource", "title", "author", "usage_count", "last_modified"],
};

/** Keys allowed in the root index.md (OKF 0.2 section 8). */
export const ROOT_INDEX_KEYS = { okf_version: "scalar" };

const PLAIN_START_FORBIDDEN = /^[&*!|>%@`{}[\],#"'?-]/;

/**
 * Splits a markdown file into frontmatter lines and body.
 * Returns { present, lines, startLine, body, bodyStartLine, error }.
 * Line numbers are 1-based file line numbers.
 */
export function splitFrontmatter(text) {
  const lines = text.split("\n");
  if (lines[0] !== "---") {
    return { present: false, lines: [], startLine: 0, body: text, bodyStartLine: 1 };
  }
  const end = lines.indexOf("---", 1);
  if (end === -1) {
    return { present: true, error: { line: 1, message: "frontmatter opened with --- but never closed" } };
  }
  return {
    present: true,
    lines: lines.slice(1, end),
    startLine: 2,
    body: lines.slice(end + 1).join("\n"),
    bodyStartLine: end + 2,
  };
}

/** Parses one scalar token; returns { value } or { error }. */
export function parseScalar(raw) {
  const s = raw.trim();
  if (s === "") return { error: "empty value" };
  if (s.startsWith('"')) {
    if (!s.endsWith('"') || s.length < 2) return { error: "unterminated double-quoted string" };
    const inner = s.slice(1, -1);
    let out = "";
    for (let i = 0; i < inner.length; i++) {
      const c = inner[i];
      if (c === "\\") {
        const n = inner[i + 1];
        if (n === '"' || n === "\\") {
          out += n;
          i++;
          continue;
        }
        return { error: `unsupported escape \\${n ?? ""}` };
      }
      if (c === '"') return { error: "unescaped double quote inside a double-quoted string" };
      out += c;
    }
    return { value: out };
  }
  if (s.startsWith("'")) {
    if (!s.endsWith("'") || s.length < 2) return { error: "unterminated single-quoted string" };
    const inner = s.slice(1, -1);
    if (inner.replace(/''/g, "").includes("'")) {
      return { error: "unescaped single quote inside a single-quoted string" };
    }
    return { value: inner.replace(/''/g, "'") };
  }
  if (PLAIN_START_FORBIDDEN.test(s)) return { error: `plain value may not start with '${s[0]}'; quote it` };
  if (s.includes(": ") || s.endsWith(":")) return { error: "plain value contains ':'; quote it" };
  if (s.includes(" #")) return { error: "plain value contains ' #'; quote it" };
  if (s === "true") return { value: true };
  if (s === "false") return { value: false };
  if (/^-?\d+$/.test(s)) return { value: Number(s) };
  if (/^(null|~|yes|no|on|off)$/i.test(s)) return { error: `ambiguous YAML value '${s}'; quote it` };
  return { value: s };
}

function parseFlowList(raw) {
  const s = raw.trim();
  if (!s.startsWith("[") || !s.endsWith("]")) return { error: "expected a [flow, list]" };
  const inner = s.slice(1, -1).trim();
  if (inner === "") return { value: [] };
  const items = [];
  for (const part of inner.split(",")) {
    const r = parseScalar(part);
    if (r.error) return { error: `list item: ${r.error}` };
    items.push(r.value);
  }
  return { value: items };
}

/** Splits `key: rest` at the first ": " (or a trailing ":"). */
function splitKey(content) {
  const m = /^([A-Za-z_][A-Za-z0-9_]*):(?: (.*))?$/.exec(content);
  if (!m) return null;
  return { key: m[1], rest: m[2] ?? "" };
}

/**
 * Parses frontmatter lines against an allowed-key schema.
 * Returns { data, errors: [{ line, message }] }.
 */
export function parseFrontmatterLines(lines, startLine, schema = CONCEPT_KEYS) {
  const data = {};
  const errors = [];
  const err = (i, message) => errors.push({ line: startLine + i, message });
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (line.includes("\t")) {
      err(i, "tab characters are not allowed in frontmatter");
      i++;
      continue;
    }
    if (line.trim() === "") {
      i++;
      continue;
    }
    if (/^\s/.test(line)) {
      err(i, "unexpected indentation");
      i++;
      continue;
    }
    if (line.startsWith("#")) {
      err(i, "comments are not allowed in frontmatter");
      i++;
      continue;
    }
    const kv = splitKey(line);
    if (!kv) {
      err(i, `cannot parse line: ${line}`);
      i++;
      continue;
    }
    const { key, rest } = kv;
    const kind = schema[key];
    if (!kind) {
      err(i, `key '${key}' is not allowed (see the authoring guide)`);
    }
    if (Object.hasOwn(data, key)) err(i, `duplicate key '${key}'`);
    // Collect the indented block that belongs to this key.
    const block = [];
    let j = i + 1;
    while (j < lines.length && (lines[j].startsWith("  ") || lines[j].trim() === "")) {
      block.push({ text: lines[j], index: j });
      j++;
    }
    while (block.length && block[block.length - 1].text.trim() === "") block.pop();
    if (rest !== "") {
      if (block.length) err(block[0].index, `key '${key}' has an inline value and an indented block`);
      if (kind === "scalar-list") {
        const r = parseFlowList(rest);
        if (r.error) err(i, `${key}: ${r.error}`);
        else data[key] = r.value;
      } else if (kind === "map" || kind === "map-list") {
        err(i, `key '${key}' needs an indented block`);
      } else {
        const r = parseScalar(rest);
        if (r.error) err(i, `${key}: ${r.error}`);
        else data[key] = r.value;
      }
    } else if (kind === "scalar") {
      err(i, `key '${key}' needs a value`);
    } else if (kind) {
      const r = parseBlock(key, kind, block, err);
      if (r !== undefined) data[key] = r;
    }
    i = j;
  }
  return { data, errors };
}

function parseBlock(key, kind, block, err) {
  const allowedSub = SUB_KEYS[key] ?? [];
  if (block.length === 0) {
    err(-1, `key '${key}' has an empty block`);
    return undefined;
  }
  if (kind === "map") {
    const out = {};
    for (const { text, index } of block) {
      if (text.trim() === "") continue;
      if (!/^ {2}\S/.test(text)) {
        err(index, "map entries are indented by exactly two spaces");
        continue;
      }
      const kv = splitKey(text.slice(2));
      if (!kv || kv.rest === "") {
        err(index, `cannot parse map entry under '${key}'`);
        continue;
      }
      if (!allowedSub.includes(kv.key)) err(index, `key '${key}.${kv.key}' is not allowed`);
      if (Object.hasOwn(out, kv.key)) err(index, `duplicate key '${key}.${kv.key}'`);
      const r = parseScalar(kv.rest);
      if (r.error) err(index, `${key}.${kv.key}: ${r.error}`);
      else out[kv.key] = r.value;
    }
    return out;
  }
  // Lists.
  const items = [];
  let current = null;
  for (const { text, index } of block) {
    if (text.trim() === "") continue;
    if (/^ {2}- /.test(text)) {
      const itemText = text.slice(4);
      if (kind === "scalar-list") {
        const r = parseScalar(itemText);
        if (r.error) err(index, `${key}: ${r.error}`);
        else items.push(r.value);
        current = null;
        continue;
      }
      const kv = splitKey(itemText);
      if (!kv || kv.rest === "") {
        err(index, `each '${key}' entry is a map of 'key: value' lines`);
        current = null;
        continue;
      }
      current = {};
      items.push(current);
      addSub(key, current, kv, index, allowedSub, err);
    } else if (/^ {4}\S/.test(text) && current && kind === "map-list") {
      const kv = splitKey(text.slice(4));
      if (!kv || kv.rest === "") {
        err(index, `cannot parse '${key}' entry line`);
        continue;
      }
      addSub(key, current, kv, index, allowedSub, err);
    } else {
      err(index, `unexpected line in '${key}' list`);
    }
  }
  return items;
}

function addSub(key, target, kv, index, allowedSub, err) {
  if (!allowedSub.includes(kv.key)) err(index, `key '${key}[].${kv.key}' is not allowed`);
  if (Object.hasOwn(target, kv.key)) err(index, `duplicate key '${key}[].${kv.key}'`);
  const r = parseScalar(kv.rest);
  if (r.error) err(index, `${key}[].${kv.key}: ${r.error}`);
  else target[kv.key] = r.value;
}

/** Splits and parses a whole file. Returns { present, data, errors, body, bodyStartLine }. */
export function parseConceptFile(text, schema = CONCEPT_KEYS) {
  const split = splitFrontmatter(text);
  if (split.error) return { present: true, data: {}, errors: [split.error], body: "", bodyStartLine: 1 };
  if (!split.present) return { present: false, data: {}, errors: [], body: split.body, bodyStartLine: 1 };
  const { data, errors } = parseFrontmatterLines(split.lines, split.startLine, schema);
  // parseBlock reports an empty block at line -1 relative; clamp to the frontmatter start.
  for (const e of errors) if (e.line < split.startLine) e.line = split.startLine;
  return { present: true, data, errors, body: split.body, bodyStartLine: split.bodyStartLine };
}

/** ISO 8601 date-time with an explicit offset (Z or +hh:mm). */
export const ISO_DATETIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2})$/;
/** A calendar date anywhere in a string. */
export const ISO_DATE_IN_TEXT = /\b(\d{4}-\d{2}-\d{2})\b/;

/** Retrieval date of a source entry: last_modified, else a date in its title. */
export function retrievalDate(source) {
  if (typeof source.last_modified === "string" && ISO_DATETIME.test(source.last_modified)) {
    return source.last_modified.slice(0, 10);
  }
  if (typeof source.title === "string") {
    const m = ISO_DATE_IN_TEXT.exec(source.title);
    if (m) return m[1];
  }
  return null;
}

/** Applies `fn` to the parts of a line outside inline code spans. */
export function mapOutsideCode(line, fn) {
  return line
    .split(/(`+[^`]*`+)/)
    .map((part, i) => (i % 2 === 1 ? part : fn(part)))
    .join("");
}

/** Footnote references `[^id]` in a line (not definitions, not inside inline code). */
export function footnoteRefs(text) {
  const ids = [];
  mapOutsideCode(text, (part) => {
    const re = /\[\^([^\]\s]+)\](?!:)/g;
    let m;
    while ((m = re.exec(part))) ids.push(m[1]);
    return part;
  });
  return ids;
}
