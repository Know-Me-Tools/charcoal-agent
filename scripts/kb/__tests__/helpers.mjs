// Shared helpers for the knowledge pipeline tests (node:test, no dependencies).
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { cpSync, mkdtempSync, readFileSync, readdirSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
export const BUNDLE = join(REPO_ROOT, "docs/knowledge-source");
export const CORPUS = join(REPO_ROOT, "content/knowledge");

export function tempDir(prefix) {
  return mkdtempSync(join(tmpdir(), `kb-${prefix}-`));
}

/** Copies a directory tree into a fresh temp directory and returns the copy. */
export function copyTree(src, prefix) {
  const dest = join(tempDir(prefix), "tree");
  cpSync(src, dest, { recursive: true });
  return dest;
}

/** sha256 of every file directly in `dir`, by name. */
export function hashDir(dir) {
  const out = {};
  for (const name of readdirSync(dir).sort()) {
    const p = join(dir, name);
    if (statSync(p).isFile()) out[name] = createHash("sha256").update(readFileSync(p)).digest("hex");
  }
  return out;
}

/** Runs a node script with arguments; returns { status, stdout, stderr }. */
export function runNode(script, args = [], options = {}) {
  const r = spawnSync(process.execPath, [join(REPO_ROOT, script), ...args], {
    cwd: REPO_ROOT,
    encoding: "utf8",
    ...options,
  });
  return { status: r.status, stdout: r.stdout, stderr: r.stderr, output: `${r.stdout}\n${r.stderr}` };
}
