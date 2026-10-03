// TJ-ARCH-MOB-001 compliant
//! The one error type handlers return. Bodies are generic: upstream details
//! are logged server-side and never sent to the browser.

use axum::Json;
use axum::http::{HeaderValue, StatusCode, header::RETRY_AFTER};
use axum::response::{IntoResponse, Response};
use serde_json::json;

#[derive(Debug, thiserror::Error)]
pub enum AppError {
    #[error("bad request: {0}")]
    BadRequest(&'static str),
    #[error("payload too large: {0}")]
    PayloadTooLarge(&'static str),
    #[error("not found")]
    NotFound,
    #[error("unsupported media type")]
    UnsupportedMediaType,
    #[error("rate limited; retry after {retry_after_secs}s")]
    RateLimited { retry_after_secs: u64 },
    #[error("upstream timed out")]
    UpstreamTimeout,
    #[error("upstream unavailable: {0}")]
    UpstreamUnavailable(#[source] reqwest::Error),
}

impl AppError {
    fn status_and_code(&self) -> (StatusCode, &'static str) {
        match self {
            Self::BadRequest(_) => (StatusCode::BAD_REQUEST, "bad_request"),
            Self::PayloadTooLarge(_) => (StatusCode::PAYLOAD_TOO_LARGE, "payload_too_large"),
            Self::NotFound => (StatusCode::NOT_FOUND, "not_found"),
            Self::UnsupportedMediaType => {
                (StatusCode::UNSUPPORTED_MEDIA_TYPE, "unsupported_media_type")
            }
            Self::RateLimited { .. } => (StatusCode::TOO_MANY_REQUESTS, "rate_limited"),
            Self::UpstreamTimeout => (StatusCode::GATEWAY_TIMEOUT, "upstream_timeout"),
            Self::UpstreamUnavailable(_) => (StatusCode::BAD_GATEWAY, "upstream_unavailable"),
        }
    }
}

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        let (status, code) = self.status_and_code();
        if status.is_server_error() {
            tracing::warn!(error = %self, "proxy error");
        }
        let message = match &self {
            Self::BadRequest(detail) | Self::PayloadTooLarge(detail) => (*detail).to_owned(),
            other => other.status_and_code().1.replace('_', " "),
        };
        let mut response =
            (status, Json(json!({ "error": code, "message": message }))).into_response();
        if let Self::RateLimited { retry_after_secs } = self {
            response
                .headers_mut()
                .insert(RETRY_AFTER, HeaderValue::from(retry_after_secs.max(1)));
        }
        response
    }
}
