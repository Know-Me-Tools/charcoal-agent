// TJ-ARCH-MOB-001 compliant
//! Router assembly.

pub mod api;
pub mod health;
pub mod static_files;
pub mod uar_proxy;

use axum::Router;
use axum::extract::DefaultBodyLimit;
use axum::http::{HeaderName, HeaderValue};
use axum::middleware::from_fn_with_state;
use axum::routing::get;
use tower_http::compression::CompressionLayer;
use tower_http::set_header::SetResponseHeaderLayer;
use tower_http::trace::{DefaultOnResponse, TraceLayer};
use tracing::Level;

use crate::domain::csp;
use crate::error::AppError;
use crate::interface::middleware::rate_limit;
use crate::interface::state::AppState;

/// Request bodies on `/api/*` above this size are rejected with 413.
pub const API_BODY_LIMIT_BYTES: usize = 32 * 1024;

/// Headers the nginx site config set; COOP/COEP are required by PGlite
/// (SharedArrayBuffer / WASM threads).
const SECURITY_HEADERS: &[(&str, &str)] = &[
    ("x-frame-options", "SAMEORIGIN"),
    ("x-content-type-options", "nosniff"),
    ("referrer-policy", "strict-origin-when-cross-origin"),
    ("cross-origin-opener-policy", "same-origin"),
    ("cross-origin-embedder-policy", "require-corp"),
    // Features the site never uses (site-security-headers 1.4).
    (
        "permissions-policy",
        "accelerometer=(), camera=(), display-capture=(), geolocation=(), gyroscope=(), \
         hid=(), magnetometer=(), microphone=(), midi=(), payment=(), serial=(), usb=(), \
         xr-spatial-tracking=()",
    ),
];

/// The policy is enforced (site-reply-content-hardening 3.4). This replaces
/// the earlier "report-only until a clean week" plan with a numeric
/// acceptance rule (corrected by the task 3.5 browser proof), measured on the
/// local run and over the first 48 hours after deploy: zero CSP reports other
/// than (a) any report whose `document` is `about:srcdoc` (an HTML preview
/// frame: inline script, `img-src` for remote images, `connect-src`, any
/// directive), (b) `frame-src`/`default-src` reports on the app page whose
/// blocked resource is a remote origin, raised when a preview navigates
/// itself away (the app has no other iframe), and (c) browser-extension
/// origins. Any other report (its document is the app page) triggers the
/// revert: rename this header back to `content-security-policy-report-only`
/// (a one-line change). The `csp violation` log line carries the
/// `document` (`routes/api.rs`) so (a) can be told apart. There is no
/// report-only twin; `report-uri`/`report-to` and `Reporting-Endpoints`
/// stay, so violations are still collected.
///
/// A `srcdoc` preview frame inherits this policy (a meta CSP inside it can
/// only tighten it), so inline scripts in model-written HTML previews are
/// blocked: risk R3, proved in a browser by task 3.5; the site shows a
/// "scripts do not run" note on such previews (decision: option 1).
const CSP_HEADER: HeaderName = HeaderName::from_static("content-security-policy");
const REPORTING_ENDPOINTS: HeaderName = HeaderName::from_static("reporting-endpoints");

pub fn router(state: AppState) -> Router {
    let csp = csp_header(&state);
    let api = Router::new()
        .merge(api::routes(&state))
        .merge(uar_proxy::routes(&state))
        .fallback(api_not_found)
        .layer(DefaultBodyLimit::max(API_BODY_LIMIT_BYTES));

    let mut app = Router::new()
        .route("/healthz", get(health::healthz))
        // Public and does an upstream call per hit: throttle it like the API.
        .route(
            "/readyz",
            get(health::readyz)
                .route_layer(from_fn_with_state(state.api_limit.clone(), rate_limit)),
        )
        .nest("/api", api)
        .fallback(static_files::serve)
        .with_state(state)
        // The default predicate skips text/event-stream, images and tiny bodies.
        .layer(CompressionLayer::new());
    for (name, value) in SECURITY_HEADERS {
        app = app.layer(SetResponseHeaderLayer::overriding(
            HeaderName::from_static(name),
            HeaderValue::from_static(value),
        ));
    }
    if let Some(csp) = csp {
        app = app
            .layer(SetResponseHeaderLayer::overriding(CSP_HEADER, csp))
            .layer(SetResponseHeaderLayer::overriding(
                REPORTING_ENDPOINTS,
                HeaderValue::from_str(&csp::reporting_endpoints())
                    .unwrap_or_else(|_| HeaderValue::from_static("")),
            ));
    }
    app.layer(TraceLayer::new_for_http().on_response(DefaultOnResponse::new().level(Level::INFO)))
}

/// The CSP for the served bundle: its inline scripts are hashed at startup.
fn csp_header(state: &AppState) -> Option<HeaderValue> {
    let documents = state.assets.html_documents();
    if documents.is_empty() {
        tracing::warn!("no HTML in the web bundle; serving no CSP");
        return None;
    }
    let mut hashes: Vec<String> = Vec::new();
    for html in &documents {
        for hash in csp::inline_script_hashes(&String::from_utf8_lossy(html)) {
            if !hashes.contains(&hash) {
                hashes.push(hash);
            }
        }
    }
    match HeaderValue::from_str(&csp::policy(&hashes)) {
        Ok(value) => Some(value),
        Err(_) => {
            tracing::error!("CSP is not a valid header value; serving no CSP");
            None
        }
    }
}

/// Every `/api` path outside the proxied route and the site's own routes.
async fn api_not_found() -> AppError {
    AppError::NotFound
}
