// TJ-ARCH-MOB-001 compliant
//! Content-Security-Policy for the site (site-security-headers).
//!
//! Script sources are `'self'` plus the SHA-256 hash of every inline script
//! in the served HTML (the theme script in `index.html`, and any prerendered
//! page's). The hashes are computed from the bundle actually served, at
//! startup, so a changed script changes the policy with the build.
//!
//! Directives beyond scripts, each traced to the built app:
//! - `'wasm-unsafe-eval'`: PGlite compiles its WASM with
//!   `WebAssembly.instantiate`/`instantiateStreaming`, which CSP blocks
//!   without it (code inspection of `@electric-sql/pglite` dist; the browser
//!   check is site-security-headers 1.2).
//! - `style-src 'unsafe-inline'`: sonner (the toaster) inserts a `<style>`
//!   element at runtime. Styles only; scripts stay hash-only.
//! - `img-src`/`font-src` `data:`: Vite inlines assets under 4 KiB as data
//!   URIs; `blob:` covers attachment previews.
//! - `connect-src 'self'`: the client calls its own origin only.

use std::fmt::Write as _;

use sha2::{Digest, Sha256};

/// Where browsers send violation reports (served by this server).
pub const REPORT_PATH: &str = "/api/csp-report";
/// The `Reporting-Endpoints` group name used by `report-to`.
pub const REPORT_GROUP: &str = "csp-endpoint";

/// `'sha256-…'` source expressions for every executable inline script in
/// `html`, in document order, without duplicates.
pub fn inline_script_hashes(html: &str) -> Vec<String> {
    let lower = html.to_ascii_lowercase();
    let mut hashes = Vec::new();
    let mut from = 0;
    while let Some(open) = lower[from..].find("<script").map(|i| from + i) {
        let Some(tag_end) = lower[open..].find('>').map(|i| open + i) else {
            break;
        };
        let Some(close) = lower[tag_end..].find("</script").map(|i| tag_end + i) else {
            break;
        };
        let attrs = &lower[open + "<script".len()..tag_end];
        if is_executable_inline(attrs) {
            let hash = sha256_source(&html[tag_end + 1..close]);
            if !hashes.contains(&hash) {
                hashes.push(hash);
            }
        }
        from = close;
    }
    hashes
}

/// No `src`, and a JavaScript type (absent, `module`, or a JS MIME type).
/// Data blocks such as `application/ld+json` are not scripts to CSP.
fn is_executable_inline(attrs: &str) -> bool {
    if has_attribute(attrs, "src") {
        return false;
    }
    match attribute_value(attrs, "type") {
        None => true,
        Some(kind) => {
            let kind = kind.trim();
            kind.is_empty()
                || kind == "module"
                || kind == "text/javascript"
                || kind == "application/javascript"
        }
    }
}

fn has_attribute(attrs: &str, name: &str) -> bool {
    attrs
        .split(|c: char| c.is_ascii_whitespace())
        .any(|token| token == name || token.starts_with(&format!("{name}=")))
}

fn attribute_value<'a>(attrs: &'a str, name: &str) -> Option<&'a str> {
    let start = attrs.find(&format!("{name}="))? + name.len() + 1;
    let rest = &attrs[start..];
    let quote = rest.chars().next()?;
    if quote == '"' || quote == '\'' {
        rest[1..].split(quote).next()
    } else {
        rest.split(|c: char| c.is_ascii_whitespace()).next()
    }
}

fn sha256_source(script: &str) -> String {
    format!("'sha256-{}'", base64(&Sha256::digest(script.as_bytes())))
}

/// The full policy for the given script hashes.
pub fn policy(script_hashes: &[String]) -> String {
    let mut scripts = String::from("'self' 'wasm-unsafe-eval'");
    for hash in script_hashes {
        let _ = write!(scripts, " {hash}");
    }
    [
        "default-src 'self'".to_owned(),
        format!("script-src {scripts}"),
        "style-src 'self' 'unsafe-inline'".to_owned(),
        "img-src 'self' data: blob:".to_owned(),
        "font-src 'self' data:".to_owned(),
        "connect-src 'self'".to_owned(),
        "object-src 'none'".to_owned(),
        "base-uri 'self'".to_owned(),
        "form-action 'self'".to_owned(),
        "frame-ancestors 'self'".to_owned(),
        format!("report-uri {REPORT_PATH}"),
        format!("report-to {REPORT_GROUP}"),
    ]
    .join("; ")
}

/// The `Reporting-Endpoints` header value naming [`REPORT_GROUP`].
pub fn reporting_endpoints() -> String {
    format!("{REPORT_GROUP}=\"{REPORT_PATH}\"")
}

/// Standard base64 with padding (RFC 4648), as CSP hash sources use.
fn base64(bytes: &[u8]) -> String {
    const ALPHABET: &[u8; 64] = b"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    let mut out = String::with_capacity(bytes.len().div_ceil(3) * 4);
    for chunk in bytes.chunks(3) {
        let b = [
            chunk[0],
            chunk.get(1).copied().unwrap_or(0),
            chunk.get(2).copied().unwrap_or(0),
        ];
        let n = (u32::from(b[0]) << 16) | (u32::from(b[1]) << 8) | u32::from(b[2]);
        for i in 0..4 {
            if i <= chunk.len() {
                out.push(char::from(ALPHABET[(n >> (18 - 6 * i)) as usize & 63]));
            } else {
                out.push('=');
            }
        }
    }
    out
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn base64_should_match_rfc_4648_vectors() {
        for (input, expected) in [
            ("", ""),
            ("f", "Zg=="),
            ("fo", "Zm8="),
            ("foo", "Zm9v"),
            ("foob", "Zm9vYg=="),
            ("fooba", "Zm9vYmE="),
            ("foobar", "Zm9vYmFy"),
        ] {
            assert_eq!(base64(input.as_bytes()), expected, "{input}");
        }
    }

    #[test]
    fn hash_should_match_the_browser_value_for_a_known_script() {
        // printf '%s' "alert('hi');" | openssl dgst -sha256 -binary | base64
        assert_eq!(
            inline_script_hashes("<script>alert('hi');</script>"),
            vec!["'sha256-S3glexDivN1XnfRGec5uF4Y7TT2a/rcrADlE/zj4maA='".to_owned()]
        );
    }

    #[test]
    fn only_executable_inline_scripts_should_be_hashed() {
        let html = r#"<head><script>
  a();
</script><script type="module" src="/assets/app.js"></script>
<script type="application/ld+json">{"@type":"Organization"}</script>
<SCRIPT type="module">b()</SCRIPT><script>
  a();
</script></head>"#;
        let hashes = inline_script_hashes(html);
        assert_eq!(hashes.len(), 2, "{hashes:?}");
        assert_eq!(hashes[0], sha256_source("\n  a();\n"));
        assert_eq!(hashes[1], sha256_source("b()"));
    }

    #[test]
    fn policy_should_allow_scripts_by_hash_only() {
        let p = policy(&["'sha256-abc='".to_owned()]);
        assert!(
            p.contains("script-src 'self' 'wasm-unsafe-eval' 'sha256-abc='"),
            "{p}"
        );
        let script = p.split("; ").find(|d| d.starts_with("script-src")).unwrap();
        assert!(!script.contains("unsafe-inline") && !script.contains("'unsafe-eval'"));
        assert!(p.contains("object-src 'none'") && p.contains("frame-ancestors 'self'"));
        assert!(p.contains("report-uri /api/csp-report"));
    }
}
