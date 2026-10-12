#!/usr/bin/env node
// Builds flat knowledge-base files in content/knowledge/ from OKF 0.2 concept
// files in docs/knowledge-source/ (site-kb-content-pipeline task 2.2).
//
// The KB ingests only flat content/knowledge/*.md files and does not parse
// frontmatter, so this build:
//   - writes ONLY the outputs listed in docs/knowledge-source/build-manifest.json;
//     it never deletes, renames or rewrites any other file in content/knowledge/
//     (the seed deletes remote documents whose local file is gone, and the
//     FR-8 checks need ipfs-sync-for-obsidian.md and the-boss.md);
//   - strips frontmatter and footnote markup;
//   - makes every `#` and `##` heading carry the product label (the H1 of the
//     concept's first-level directory index.md), appending " (<label>)" when
//     the heading does not already contain it;
//   - appends "Source: <title or URL>, retrieved <date>." under every section
//     that makes an external claim (a footnote reference [^id], or every
//     section when the concept sets external_claims: true);
//   - is deterministic: no timestamps, LF line endings, one trailing newline.
//
// Usage:
//   node scripts/kb/build-kb.mjs            write outputs that differ
//   node scripts/kb/build-kb.mjs --check    exit 1 if any output would change
// Options (for tests): --manifest <file> --source-dir <dir> --out-dir <dir>

import { existsSync, lstatSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { footnoteRefs, mapOutsideCode, parseConceptFile, retrievalDate } from "./lib/frontmatter.mjs";

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const RESERVED = new Set(["index.md", "log.md"]);
const OUTPUT_NAME = /^[a-z0-9][a-z0-9-]*\.md$/;
const HEADING = /^(#{1,2}) +(.+?)\s*$/;
const FENCE = /^\s*(```|~~~)/;
const FOOTNOTE_DEF = /^\[\^[^\]\s]+\]:/;
const FOOTNOTE_REF = /\[\^[^\]\s]+\](?!:)/g;

export function parseArgs(argv) {
  const opts = {
    check: false,
    manifest: join(REPO_ROOT, "docs/knowledge-source/build-manifest.json"),
    sourceDir: join(REPO_ROOT, "docs/knowledge-source"),
    outDir: join(REPO_ROOT, "content/knowledge"),
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const next = () => {
      if (i + 1 >= argv.length) throw new Error(`${a} needs a value`);
      return argv[++i];
    };
    if (a === "--check") opts.check = true;
    else if (a === "--manifest") opts.manifest = resolve(next());
    else if (a === "--source-dir") opts.sourceDir = resolve(next());
    else if (a === "--out-dir") opts.outDir = resolve(next());
    else throw new Error(`unknown argument: ${a}`);
  }
  return opts;
}

/** Reads and validates the manifest. Returns { entries, errors }. */
export function loadManifest(path) {
  const errors = [];
  let parsed;
  try {
    parsed = JSON.parse(readFileSync(path, "utf8"));
  } catch (e) {
    return { entries: [], errors: [`${path}: cannot read manifest: ${e.message}`] };
  }
  const keys = parsed && typeof parsed === "object" && !Array.isArray(parsed) ? Object.keys(parsed) : [];
  if (!Array.isArray(parsed?.entries) || keys.some((k) => k !== "entries")) {
    return { entries: [], errors: [`${path}: manifest must be {"entries": [...]} and nothing else`] };
  }
  const seenSource = new Set();
  const seenOutput = new Set();
  parsed.entries.forEach((entry, n) => {
    const where = `${path}: entries[${n}]`;
    const ek = entry && typeof entry === "object" ? Object.keys(entry).sort().join(",") : "";
    if (ek !== "output,source") {
      errors.push(`${where}: each entry is exactly {"source", "output"}`);
      return;
    }
    const { source, output } = entry;
    if (typeof source !== "string" || !/^[a-z0-9][a-z0-9-]*(\/[a-z0-9][a-z0-9-]*)*\.md$/.test(source)) {
      errors.push(`${where}: source must be a bundle-relative path like "knowme/x.md"`);
    } else if (!source.includes("/")) {
      errors.push(`${where}: source must sit in a product directory, not the bundle root`);
    } else if (RESERVED.has(source.split("/").pop())) {
      errors.push(`${where}: source may not be a reserved index.md or log.md`);
    }
    if (typeof output !== "string" || !OUTPUT_NAME.test(output)) {
      errors.push(`${where}: output must be a flat lowercase file name like "x.md"`);
    }
    if (seenSource.has(source)) errors.push(`${where}: duplicate source ${source}`);
    if (seenOutput.has(output)) errors.push(`${where}: duplicate output ${output}`);
    seenSource.add(source);
    seenOutput.add(output);
  });
  return { entries: errors.length ? [] : parsed.entries, errors };
}

/** The product label: the first `# ` heading of <product-dir>/index.md. */
export function productLabel(sourceDir, source) {
  const productDir = source.split("/")[0];
  const indexPath = join(sourceDir, productDir, "index.md");
  if (!existsSync(indexPath)) return null;
  const h1 = readFileSync(indexPath, "utf8")
    .split("\n")
    .find((l) => /^# +\S/.test(l));
  return h1 ? h1.replace(/^# +/, "").trim() : null;
}

function labelHeading(text, label) {
  return text.toLowerCase().includes(label.toLowerCase()) ? text : `${text} (${label})`;
}

function attributionLines(ids, sources, sourcePath, errors) {
  return ids.flatMap((id) => {
    const src = sources.get(id);
    if (!src) {
      errors.push(`${sourcePath}: footnote [^${id}] has no matching sources entry`);
      return [];
    }
    const name = typeof src.title === "string" && src.title ? src.title : src.resource;
    const date = retrievalDate(src);
    if (!name || !date) {
      errors.push(`${sourcePath}: source '${id}' needs a resource and a retrieval date`);
      return [];
    }
    return [`Source: ${name}, retrieved ${date}.`];
  });
}

/**
 * Converts one concept file. Returns { output, errors }.
 * `text` is the concept file, `label` its product label.
 */
export function buildConcept({ text, label, sourcePath }) {
  const errors = [];
  const parsed = parseConceptFile(text);
  if (!parsed.present) errors.push(`${sourcePath}: missing frontmatter`);
  for (const e of parsed.errors) errors.push(`${sourcePath}:${e.line}: ${e.message}`);
  const fm = parsed.data;
  if (typeof fm.type !== "string" || fm.type.trim() === "") errors.push(`${sourcePath}: frontmatter needs a non-empty type`);
  const sources = new Map();
  for (const s of Array.isArray(fm.sources) ? fm.sources : []) {
    if (typeof s.id === "string") sources.set(s.id, s);
  }
  const allIds = [...sources.keys()];

  // Split the body into sections at # and ## headings outside code fences.
  const sections = [{ heading: null, lines: [] }];
  let inFence = false;
  for (const line of parsed.body.split("\n")) {
    if (FENCE.test(line)) inFence = !inFence;
    if (!inFence && FOOTNOTE_DEF.test(line)) continue;
    const h = !inFence && HEADING.exec(line);
    if (h) sections.push({ heading: { hashes: h[1], text: h[2] }, lines: [] });
    else sections[sections.length - 1].lines.push({ line, inFence: inFence || FENCE.test(line) });
  }

  const out = [];
  for (const section of sections) {
    const refs = [];
    const bodyLines = section.lines.map(({ line, inFence: fenced }) => {
      if (fenced) return line.trimEnd();
      refs.push(...footnoteRefs(line));
      return mapOutsideCode(line, (part) => part.replace(FOOTNOTE_REF, "")).trimEnd();
    });
    let headingLine = null;
    if (section.heading) {
      refs.unshift(...footnoteRefs(section.heading.text));
      const clean = mapOutsideCode(section.heading.text, (part) => part.replace(FOOTNOTE_REF, "")).trim();
      headingLine = `${section.heading.hashes} ${labelHeading(clean, label)}`;
    }
    while (bodyLines.length && bodyLines[0] === "") bodyLines.shift();
    while (bodyLines.length && bodyLines[bodyLines.length - 1] === "") bodyLines.pop();
    if (!headingLine && bodyLines.length === 0) continue;
    let ids = [...new Set(refs)];
    if (ids.length === 0 && fm.external_claims === true && bodyLines.length > 0) ids = allIds;
    const attribution = attributionLines(ids, sources, sourcePath, errors);
    const block = [];
    if (headingLine) block.push(headingLine);
    if (bodyLines.length) {
      if (headingLine) block.push("");
      block.push(...bodyLines);
    }
    if (attribution.length) block.push("", ...attribution);
    out.push(block.join("\n"));
  }
  const output = `${out.join("\n\n").replace(/\n{3,}/g, "\n\n").trim()}\n`;
  return { output, errors };
}

/** Refuses output paths that could reach a file the manifest does not list. */
export function outputCollisions(outDir, outputs) {
  const errors = [];
  const existing = existsSync(outDir) ? readdirSync(outDir) : [];
  for (const output of outputs) {
    const path = join(outDir, output);
    if (!resolve(path).startsWith(resolve(outDir) + sep)) {
      errors.push(`${output}: resolves outside ${outDir}`);
      continue;
    }
    const twin = existing.find((name) => name !== output && name.toLowerCase() === output.toLowerCase());
    if (twin) {
      errors.push(`${output}: refusing to overwrite unlisted existing file ${twin} (names differ only by case)`);
    }
    if (existsSync(path) || existing.includes(output)) {
      const st = lstatSync(path);
      if (st.isSymbolicLink()) errors.push(`${output}: refusing to write through a symbolic link`);
      else if (!st.isFile()) errors.push(`${output}: exists and is not a regular file`);
    }
  }
  return errors;
}

export function run(argv) {
  const opts = parseArgs(argv);
  const { entries, errors } = loadManifest(opts.manifest);
  const built = [];
  for (const { source, output } of entries) {
    const sourcePath = join(opts.sourceDir, source);
    if (!existsSync(sourcePath)) {
      errors.push(`${source}: listed in the manifest but not found`);
      continue;
    }
    const label = productLabel(opts.sourceDir, source);
    if (!label) {
      errors.push(`${source}: its product directory has no index.md with a '# ' heading (the product label)`);
      continue;
    }
    const r = buildConcept({ text: readFileSync(sourcePath, "utf8"), label, sourcePath: source });
    errors.push(...r.errors);
    built.push({ output, content: r.output });
  }
  errors.push(...outputCollisions(opts.outDir, built.map((b) => b.output)));
  if (errors.length) {
    for (const e of errors) console.error(`build-kb: ERROR: ${e}`);
    return 1;
  }
  const changed = built.filter(({ output, content }) => {
    const path = join(opts.outDir, output);
    return !existsSync(path) || readFileSync(path, "utf8") !== content;
  });
  if (opts.check) {
    for (const { output } of changed) console.error(`build-kb: out of date: ${output}`);
    console.log(`build-kb: --check: ${built.length} manifest output(s), ${changed.length} out of date`);
    return changed.length ? 1 : 0;
  }
  for (const { output, content } of changed) {
    writeFileSync(join(opts.outDir, output), content);
    console.log(`build-kb: wrote ${output}`);
  }
  console.log(`build-kb: ${built.length} manifest output(s), ${changed.length} written`);
  return 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    process.exitCode = run(process.argv.slice(2));
  } catch (e) {
    console.error(`build-kb: ERROR: ${e.message}`);
    process.exitCode = 2;
  }
}
