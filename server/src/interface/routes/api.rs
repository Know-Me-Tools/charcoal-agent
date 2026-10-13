// TJ-ARCH-MOB-001 compliant
//! The site's own APIs (served by this server, not UAR), relative to `/api`.
//!
//! Add routes here, e.g. `.route("/contact", post(...))`, each with a use
//! case in `application/`. They inherit the 32 KiB body limit and the `/api`
//! 404 fallback; add a `rate_limit` route layer to anything reachable by the
//! public.
//!
//! `POST /api/csp-report` receives CSP violation reports (site-security-headers
//! 1.3; the policy is enforced since site-reply-content-hardening 3.4). Each
//! report becomes one WARN log line with the directive, the blocked resource
//! reduced to its origin or keyword, the disposition, and the document the
//! violation happened in: what the operator reads against the acceptance rule
//! on `CSP_HEADER` in `routes/mod.rs`. The document tells a preview frame
//! (`about:srcdoc`) from the app's own page (site-reply-content-hardening
//! 3.5). It is logged without query string or fragment, with id-shaped path
//! segments (thread UUIDs) masked as `:id`, at most 200 characters. No sample
//! and no report body is logged.

use axum::Router;
use axum::body::Bytes;
use axum::http::StatusCode;
use axum::middleware::from_fn_with_state;
use axum::routing::post;
use serde_json::Value;

use crate::interface::middleware::rate_limit;
use crate::interface::state::AppState;

/// Most reports logged from one request (a `reports+json` batch).
const MAX_REPORTS_PER_REQUEST: usize = 20;

pub fn routes(state: &AppState) -> Router<AppState> {
    Router::new().route(
        "/csp-report",
        post(csp_report).route_layer(from_fn_with_state(state.api_limit.clone(), rate_limit)),
    )
}

async fn csp_report(body: Bytes) -> StatusCode {
    let Ok(value) = serde_json::from_slice::<Value>(&body) else {
        return StatusCode::BAD_REQUEST;
    };
    for report in violations(&value).into_iter().take(MAX_REPORTS_PER_REQUEST) {
        tracing::warn!(
            directive = report.directive,
            blocked = report.blocked,
            disposition = report.disposition,
            document = report.document,
            "csp violation"
        );
    }
    StatusCode::NO_CONTENT
}

#[derive(Debug, PartialEq, Eq)]
struct Violation {
    directive: String,
    blocked: String,
    disposition: String,
    document: String,
}

/// Longest `document` value logged.
const MAX_DOCUMENT_CHARS: usize = 200;

/// Reads both formats: `application/csp-report` (`{"csp-report": {...}}`,
/// kebab-case) and `application/reports+json` (an array of
/// `{"type": "csp-violation", "body": {...}}`, camelCase).
fn violations(value: &Value) -> Vec<Violation> {
    if let Some(report) = value.get("csp-report") {
        return vec![violation(
            report,
            "effective-directive",
            "violated-directive",
            "blocked-uri",
            "document-uri",
        )];
    }
    value
        .as_array()
        .map(|reports| {
            reports
                .iter()
                .filter(|r| r.get("type").and_then(Value::as_str) == Some("csp-violation"))
                .filter_map(|r| r.get("body"))
                .map(|b| {
                    violation(
                        b,
                        "effectiveDirective",
                        "effectiveDirective",
                        "blockedURL",
                        "documentURL",
                    )
                })
                .collect()
        })
        .unwrap_or_default()
}

fn violation(
    body: &Value,
    directive: &str,
    fallback: &str,
    blocked: &str,
    document: &str,
) -> Violation {
    let text = |key: &str| body.get(key).and_then(Value::as_str).unwrap_or_default();
    let directive = Some(text(directive))
        .filter(|d| !d.is_empty())
        .unwrap_or_else(|| text(fallback));
    Violation {
        directive: short(directive),
        blocked: blocked_source(text(blocked)),
        disposition: short(text("disposition")),
        document: document_source(text(document)),
    }
}

/// The document URL without query or fragment, id-shaped path segments
/// masked, at most [`MAX_DOCUMENT_CHARS`]. `about:srcdoc` stays as is.
fn document_source(raw: &str) -> String {
    let without_fragment = raw.split('#').next().unwrap_or_default();
    let without_query = without_fragment.split('?').next().unwrap_or_default();
    let masked: Vec<&str> = without_query
        .split('/')
        .map(|segment| if is_uuid(segment) { ":id" } else { segment })
        .collect();
    masked.join("/").chars().take(MAX_DOCUMENT_CHARS).collect()
}

/// `8-4-4-4-12` hex digits, the shape of a thread id.
fn is_uuid(segment: &str) -> bool {
    segment.len() == 36
        && segment.char_indices().all(|(i, c)| match i {
            8 | 13 | 18 | 23 => c == '-',
            _ => c.is_ascii_hexdigit(),
        })
}

/// `inline`/`eval`/`data` stay as keywords; a URL keeps only scheme and host.
fn blocked_source(raw: &str) -> String {
    match raw.split_once("://") {
        Some((scheme, rest)) => {
            let host = rest.split(['/', '?', '#']).next().unwrap_or_default();
            short(&format!("{scheme}://{host}"))
        }
        None => short(raw.split(':').next().unwrap_or_default()),
    }
}

fn short(text: &str) -> String {
    text.chars().take(100).collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn legacy_report_should_keep_directive_and_origin_only() {
        let value: Value = serde_json::from_str(
            r#"{"csp-report":{"document-uri":"https://know-me.tools/threads/0b7e3c1a-5f0e-4a8e-9c3b-2d1f4e5a6b7c",
              "effective-directive":"img-src","blocked-uri":"https://evil.example/p.png?id=7",
              "disposition":"report"}}"#,
        )
        .unwrap();
        assert_eq!(
            violations(&value),
            vec![Violation {
                directive: "img-src".into(),
                blocked: "https://evil.example".into(),
                disposition: "report".into(),
                document: "https://know-me.tools/threads/:id".into(),
            }]
        );
    }

    #[test]
    fn legacy_report_from_a_preview_frame_should_log_about_srcdoc() {
        let value: Value = serde_json::from_str(
            r#"{"csp-report":{"document-uri":"about:srcdoc","violated-directive":"script-src-elem",
              "blocked-uri":"inline","disposition":"enforce"}}"#,
        )
        .unwrap();
        let found = violations(&value);
        assert_eq!(found.len(), 1);
        assert_eq!(found[0].document, "about:srcdoc");
        assert_eq!(found[0].directive, "script-src-elem");
    }

    #[test]
    fn reporting_api_document_should_drop_query_and_fragment_and_mask_ids() {
        let value: Value = serde_json::from_str(
            r#"[{"type":"csp-violation","body":{"effectiveDirective":"img-src",
                  "blockedURL":"https://cdn.example/p.png",
                  "documentURL":"https://know-me.tools/threads/0B7E3C1A-5f0e-4a8e-9c3b-2d1f4e5a6b7c?q=secret#frag",
                  "disposition":"enforce"}},
                {"type":"csp-violation","body":{"effectiveDirective":"script-src-elem",
                  "blockedURL":"inline","documentURL":"about:srcdoc","disposition":"enforce"}}]"#,
        )
        .unwrap();
        let found = violations(&value);
        assert_eq!(
            found
                .iter()
                .map(|v| v.document.as_str())
                .collect::<Vec<_>>(),
            vec!["https://know-me.tools/threads/:id", "about:srcdoc"]
        );
        assert!(found.iter().all(|v| !v.document.contains("secret")));
    }

    #[test]
    fn document_should_be_truncated_and_empty_when_missing() {
        let long = format!("https://know-me.tools/{}", "a".repeat(400));
        assert_eq!(document_source(&long).chars().count(), MAX_DOCUMENT_CHARS);
        assert_eq!(document_source(""), "");
        let value: Value =
            serde_json::from_str(r#"{"csp-report":{"effective-directive":"img-src"}}"#).unwrap();
        assert_eq!(violations(&value)[0].document, "");
    }

    #[test]
    fn reporting_api_batch_should_be_read() {
        let value: Value = serde_json::from_str(
            r#"[{"type":"csp-violation","body":{"effectiveDirective":"script-src-elem",
                  "blockedURL":"inline","disposition":"report"}},
                {"type":"deprecation","body":{}}]"#,
        )
        .unwrap();
        let found = violations(&value);
        assert_eq!(found.len(), 1);
        assert_eq!(
            (found[0].directive.as_str(), found[0].blocked.as_str()),
            ("script-src-elem", "inline")
        );
        assert_eq!(blocked_source("data:image/png;base64,AAA"), "data");
    }
}
