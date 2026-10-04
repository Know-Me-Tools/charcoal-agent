// TJ-ARCH-MOB-001 compliant
//! The compiled web bundle: embedded at build time, or an external directory.

use std::borrow::Cow;
use std::path::{Component, Path, PathBuf};

include!(concat!(env!("OUT_DIR"), "/embedded_assets.rs"));

#[derive(Debug, Clone)]
pub enum AssetSource {
    Embedded,
    /// `KNOWME_WEB_ROOT`: a compiled bundle on disk, read per request.
    Directory(PathBuf),
}

impl AssetSource {
    pub fn from_web_root(web_root: Option<PathBuf>) -> Self {
        web_root.map_or(Self::Embedded, Self::Directory)
    }

    /// `rel` is a `/`-separated path without a leading slash.
    pub async fn load(&self, rel: &str) -> Option<Cow<'static, [u8]>> {
        match self {
            Self::Embedded => EMBEDDED_ASSETS
                .binary_search_by(|(path, _)| (*path).cmp(rel))
                .ok()
                .map(|i| Cow::Borrowed(EMBEDDED_ASSETS[i].1)),
            Self::Directory(root) => {
                let path = safe_join(root, rel)?;
                tokio::fs::read(path).await.ok().map(Cow::Owned)
            }
        }
    }

    /// Every `.html` file in the bundle, for the startup CSP hash scan. An
    /// external root is walked once, synchronously, at startup.
    pub fn html_documents(&self) -> Vec<Vec<u8>> {
        match self {
            Self::Embedded => EMBEDDED_ASSETS
                .iter()
                .filter(|(path, _)| path.ends_with(".html"))
                .map(|(_, bytes)| bytes.to_vec())
                .collect(),
            Self::Directory(root) => {
                let mut out = Vec::new();
                collect_html(root, &mut out);
                out
            }
        }
    }

    /// An external root must be an existing bundle; the embedded one always is.
    pub fn is_ready(&self) -> bool {
        match self {
            Self::Embedded => true,
            Self::Directory(root) => root.join("index.html").is_file(),
        }
    }
}

fn collect_html(dir: &Path, out: &mut Vec<Vec<u8>>) {
    let Ok(entries) = std::fs::read_dir(dir) else {
        return;
    };
    for entry in entries.flatten() {
        let path = entry.path();
        if path.is_dir() {
            collect_html(&path, out);
        } else if path.extension().is_some_and(|ext| ext == "html")
            && let Ok(bytes) = std::fs::read(&path)
        {
            out.push(bytes);
        }
    }
}

/// Joins only plain segments, so `..`, absolute paths and prefixes cannot
/// escape the root.
fn safe_join(root: &Path, rel: &str) -> Option<PathBuf> {
    let rel = Path::new(rel);
    if rel.components().all(|c| matches!(c, Component::Normal(_))) {
        Some(root.join(rel))
    } else {
        None
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn safe_join_should_reject_traversal() {
        let root = Path::new("/srv/web");
        assert!(safe_join(root, "../etc/passwd").is_none());
        assert!(safe_join(root, "/etc/passwd").is_none());
        assert_eq!(
            safe_join(root, "assets/a.js"),
            Some(PathBuf::from("/srv/web/assets/a.js"))
        );
    }
}
