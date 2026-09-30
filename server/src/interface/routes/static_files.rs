// TJ-ARCH-MOB-001 compliant
//! Static SPA hosting with client-side routing fallback.

use std::borrow::Cow;

use axum::body::Body;
use axum::extract::State;
use axum::http::header::{ALLOW, CACHE_CONTROL, CONTENT_LENGTH, CONTENT_TYPE};
use axum::http::{HeaderValue, Method, StatusCode, Uri};
use axum::response::{IntoResponse, Response};

use crate::interface::state::AppState;

/// Vite content-hashes everything under `assets/`.
const HASHED_PREFIX: &str = "assets/";
const IMMUTABLE: &str = "public, max-age=31536000, immutable";
/// Unhashed public files (favicon, robots.txt, og-image): short cache.
const SHORT: &str = "public, max-age=3600";
const NO_CACHE: &str = "no-cache";

pub async fn serve(State(state): State<AppState>, method: Method, uri: Uri) -> Response {
    if method != Method::GET && method != Method::HEAD {
        return (StatusCode::METHOD_NOT_ALLOWED, [(ALLOW, "GET, HEAD")]).into_response();
    }
    let path = uri.path().trim_start_matches('/');

    if !path.is_empty() {
        if let Some(bytes) = state.assets.load(path).await {
            return file_response(path, bytes, &method);
        }
        // Prerendered route, e.g. `/about` -> `about/index.html`.
        let nested = format!("{}/index.html", path.trim_end_matches('/'));
        if let Some(bytes) = state.assets.load(&nested).await {
            return file_response(&nested, bytes, &method);
        }
        // A missing file (has an extension) is a 404, not the app shell.
        if last_segment_has_extension(path) {
            return (StatusCode::NOT_FOUND, "not found").into_response();
        }
    }
    match state.assets.load("index.html").await {
        Some(bytes) => file_response("index.html", bytes, &method),
        None => (StatusCode::SERVICE_UNAVAILABLE, "web bundle unavailable").into_response(),
    }
}

fn file_response(path: &str, bytes: Cow<'static, [u8]>, method: &Method) -> Response {
    let cache = if path.ends_with(".html") {
        NO_CACHE
    } else if path.starts_with(HASHED_PREFIX) {
        IMMUTABLE
    } else {
        SHORT
    };
    let length = bytes.len();
    let body = if *method == Method::HEAD {
        Body::empty()
    } else {
        Body::from(bytes)
    };
    let mut response = Response::new(body);
    let headers = response.headers_mut();
    // Explicit so HEAD reports the entity's length, not the empty body's.
    headers.insert(CONTENT_LENGTH, HeaderValue::from(length));
    headers.insert(CONTENT_TYPE, HeaderValue::from_static(content_type(path)));
    headers.insert(CACHE_CONTROL, HeaderValue::from_static(cache));
    response
}

fn last_segment_has_extension(path: &str) -> bool {
    path.rsplit('/')
        .next()
        .is_some_and(|segment| segment.contains('.'))
}

fn content_type(path: &str) -> &'static str {
    let ext = path.rsplit_once('.').map_or("", |(_, ext)| ext);
    match ext.to_ascii_lowercase().as_str() {
        "html" => "text/html; charset=utf-8",
        "js" | "mjs" => "text/javascript; charset=utf-8",
        "css" => "text/css; charset=utf-8",
        "json" | "map" => "application/json",
        "webmanifest" => "application/manifest+json",
        "wasm" => "application/wasm",
        // PGlite's filesystem bundle; fetched as bytes.
        "data" => "application/octet-stream",
        "svg" => "image/svg+xml",
        "png" => "image/png",
        "jpg" | "jpeg" => "image/jpeg",
        "gif" => "image/gif",
        "webp" => "image/webp",
        "avif" => "image/avif",
        "ico" => "image/x-icon",
        "woff2" => "font/woff2",
        "woff" => "font/woff",
        "ttf" => "font/ttf",
        "otf" => "font/otf",
        "txt" => "text/plain; charset=utf-8",
        "xml" => "application/xml",
        _ => "application/octet-stream",
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn wasm_and_pglite_data_should_have_correct_types() {
        assert_eq!(content_type("assets/pglite-x.wasm"), "application/wasm");
        assert_eq!(
            content_type("assets/pglite-x.data"),
            "application/octet-stream"
        );
    }
}
