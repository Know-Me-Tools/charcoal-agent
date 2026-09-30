// TJ-ARCH-MOB-001 compliant
//
// Embeds the KnowMe web bundle into the server binary.
//
// Asset source (deploy-hybrid-agentic-stack, "Asset modes for Axum"):
// - `KNOWME_WEB_DIST_DIR` set: use that prebuilt Vite `dist/` as-is.
// - otherwise: run the tracked package build (`npm run build`) in the repo root
//   with `--outDir $OUT_DIR/web-dist`. This never installs dependencies and
//   never writes into the source tree; a missing `node_modules` fails the build
//   with an instruction to run `npm ci`.
//
// Public-build guard: a key in the client bundle is readable by every visitor,
// so the build fails when `VITE_UAR_API_KEY` is set in the build environment.
// Vite also loads `.env*` files, and the repo's local `.env` may carry a
// developer key and base URL; process env beats `.env` in Vite, so the npm
// child gets both forced empty. The public site must call its own origin.

use std::env;
use std::fmt::Write as _;
use std::fs;
use std::path::{Path, PathBuf};
use std::process::{self, Command};
use std::time::Instant;

const DIST_DIR_ENV: &str = "KNOWME_WEB_DIST_DIR";
const AGENT_ENV: &str = "VITE_SITE_AGENT_ID";
const DEFAULT_AGENT: &str = "knowme-site";
const KEY_ENV: &str = "VITE_UAR_API_KEY";
const BASE_URL_ENV: &str = "VITE_UAR_BASE_URL";
/// Read by vite.config.ts: TAURI_ENV_DEBUG disables minification and emits
/// sourcemaps, TAURI_ENV_PLATFORM changes the build target. Never public.
const TAURI_ENVS: [&str; 2] = ["TAURI_ENV_DEBUG", "TAURI_ENV_PLATFORM"];
/// The files Vite loads production-mode variables from.
const ENV_FILES: &[&str] = &[
    ".env",
    ".env.local",
    ".env.production",
    ".env.production.local",
];

/// Inputs of the web build, relative to the repo root.
const WEB_INPUTS: &[&str] = &[
    "src",
    "content",
    "public",
    "index.html",
    "package.json",
    "package-lock.json",
    "vite.config.ts",
];

fn main() {
    for var in [DIST_DIR_ENV, AGENT_ENV, KEY_ENV, BASE_URL_ENV]
        .iter()
        .chain(&TAURI_ENVS)
    {
        println!("cargo:rerun-if-env-changed={var}");
    }
    if env::var(KEY_ENV).is_ok_and(|v| !v.trim().is_empty()) {
        fail(&format!(
            "{KEY_ENV} is set in the build environment. The public site bundle must not \
             carry a UAR key; the server injects SITE_PROXY_API_KEY at runtime. Unset it."
        ));
    }

    let manifest_dir = PathBuf::from(required_env("CARGO_MANIFEST_DIR"));
    let out_dir = PathBuf::from(required_env("OUT_DIR"));

    let dist = match env::var_os(DIST_DIR_ENV) {
        Some(dir) => prebuilt_dist(&manifest_dir.join(dir), manifest_dir.parent()),
        None => build_web(&manifest_dir, &out_dir),
    };

    let generated = out_dir.join("embedded_assets.rs");
    if let Err(err) = fs::write(&generated, render_asset_table(&dist)) {
        fail(&format!("cannot write {}: {err}", generated.display()));
    }
}

fn prebuilt_dist(dir: &Path, repo_root: Option<&Path>) -> PathBuf {
    println!("cargo:rerun-if-changed={}", dir.display());
    require_index(dir);
    // A plain `npm run build` reads the developer's `.env`; refuse a prebuilt
    // bundle that carries the key found there.
    let keys = repo_root.map(local_env_keys).unwrap_or_default();
    if !keys.is_empty() {
        let mut files = Vec::new();
        collect_files(dir, dir, &mut files);
        for (rel, path) in &files {
            let Ok(bytes) = fs::read(path) else { continue };
            if keys.iter().any(|k| contains(&bytes, k.as_bytes())) {
                fail(&format!(
                    "{rel} in {DIST_DIR_ENV} contains the {KEY_ENV} value from a local .env \
                     file. Rebuild the bundle with {KEY_ENV} set to empty."
                ));
            }
        }
    }
    dir.to_path_buf()
}

/// Non-empty `VITE_UAR_API_KEY` values in the repo's Vite env files.
fn local_env_keys(repo_root: &Path) -> Vec<String> {
    ENV_FILES
        .iter()
        .filter_map(|f| fs::read_to_string(repo_root.join(f)).ok())
        .flat_map(|text| text.lines().filter_map(env_key_value).collect::<Vec<_>>())
        .collect()
}

fn env_key_value(line: &str) -> Option<String> {
    let line = line.trim();
    let line = line.strip_prefix("export ").unwrap_or(line);
    let value = line.strip_prefix(KEY_ENV)?.trim_start().strip_prefix('=')?;
    let value = value.trim().trim_matches(|c| c == '"' || c == '\'');
    (!value.is_empty()).then(|| value.to_owned())
}

fn contains(haystack: &[u8], needle: &[u8]) -> bool {
    !needle.is_empty() && haystack.windows(needle.len()).any(|w| w == needle)
}

fn build_web(manifest_dir: &Path, out_dir: &Path) -> PathBuf {
    let Some(repo_root) = manifest_dir.parent() else {
        fail("server/ has no parent directory to build the web bundle from");
    };
    emit_web_inputs(repo_root);

    if !repo_root.join("node_modules").is_dir() {
        fail(&format!(
            "{} has no node_modules. Run `npm ci` in the repo root first, or set {DIST_DIR_ENV} \
             to a prebuilt dist/. build.rs never installs dependencies.",
            repo_root.display()
        ));
    }

    let dist = out_dir.join("web-dist");
    let agent = env::var(AGENT_ENV)
        .ok()
        .filter(|v| !v.trim().is_empty())
        .unwrap_or_else(|| DEFAULT_AGENT.to_owned());

    let started = Instant::now();
    let status = Command::new("npm")
        .args(["run", "build", "--", "--outDir"])
        .arg(&dist)
        .arg("--emptyOutDir")
        .current_dir(repo_root)
        .env(AGENT_ENV, &agent)
        .env(KEY_ENV, "")
        .env(BASE_URL_ENV, "")
        .env_remove(TAURI_ENVS[0])
        .env_remove(TAURI_ENVS[1])
        .status();
    match status {
        Ok(s) if s.success() => {}
        Ok(s) => fail(&format!("`npm run build` exited with {s}")),
        Err(err) => fail(&format!("cannot run `npm`: {err}")),
    }
    println!(
        "cargo:warning=web bundle built for agent `{agent}` in {:.1}s",
        started.elapsed().as_secs_f64()
    );
    require_index(&dist);
    dist
}

fn emit_web_inputs(repo_root: &Path) {
    let mut inputs: Vec<PathBuf> = WEB_INPUTS
        .iter()
        .chain(ENV_FILES)
        .map(|p| repo_root.join(p))
        .collect();
    if let Ok(entries) = fs::read_dir(repo_root) {
        for entry in entries.flatten() {
            let name = entry.file_name();
            let name = name.to_string_lossy();
            if name.starts_with("tsconfig") && name.ends_with(".json") {
                inputs.push(entry.path());
            }
        }
    }
    // Only existing paths: cargo reruns every build for a missing one.
    for path in inputs.iter().filter(|p| p.exists()) {
        println!("cargo:rerun-if-changed={}", path.display());
    }
}

fn require_index(dir: &Path) {
    if !dir.join("index.html").is_file() {
        fail(&format!(
            "{} has no index.html; not a Vite dist",
            dir.display()
        ));
    }
}

fn render_asset_table(dist: &Path) -> String {
    let mut files = Vec::new();
    collect_files(dist, dist, &mut files);
    files.sort();

    let mut out = String::from(
        "// @generated by build.rs; sorted by path for binary search.\n\
         pub(crate) static EMBEDDED_ASSETS: &[(&str, &[u8])] = &[\n",
    );
    for (rel, abs) in &files {
        // `{:?}` yields a valid, escaped Rust string literal.
        let _ = writeln!(
            out,
            "    ({rel:?}, include_bytes!({:?})),",
            abs.display().to_string()
        );
    }
    out.push_str("];\n");
    out
}

fn collect_files(root: &Path, dir: &Path, files: &mut Vec<(String, PathBuf)>) {
    let entries = match fs::read_dir(dir) {
        Ok(entries) => entries,
        Err(err) => fail(&format!("cannot read {}: {err}", dir.display())),
    };
    for entry in entries.flatten() {
        let path = entry.path();
        if path.is_dir() {
            collect_files(root, &path, files);
            continue;
        }
        let Ok(rel) = path.strip_prefix(root) else {
            continue;
        };
        let rel = rel
            .components()
            .map(|c| c.as_os_str().to_string_lossy())
            .collect::<Vec<_>>()
            .join("/");
        files.push((rel, path));
    }
}

fn required_env(name: &str) -> String {
    env::var(name).unwrap_or_else(|_| fail(&format!("cargo did not set {name}")))
}

fn fail(message: &str) -> ! {
    eprintln!("knowme-site-server build: {message}");
    process::exit(1);
}
