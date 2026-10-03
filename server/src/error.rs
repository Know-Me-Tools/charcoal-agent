// TJ-ARCH-MOB-001 compliant
//! The one error type handlers return. Bodies are generic: upstream status
//! and body details are logged server-side (status and route only) and never
//! sent to the browser.

use axum::Json;
use axum::http::{HeaderValue, StatusCode, header::RETRY_AFTER};
use axum::response::{IntoResponse, Response};
use serde_json::json;

/// Shown when UAR's input guardrail blocks a message. Carries no UAR text.
/// Wording owner: km-conversational-designer.
pub const GUARDRAIL_MESSAGE: &str =
    "This message can't be answered here. Try asking about KnowMe in a different way.";

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
    /// UAR's 400 `guardrail_blocked`.
    #[error("blocked by the upstream input guardrail")]
    GuardrailBlocked,
    /// Any other upstream non-2xx. Already logged with status and route.
    #[error("upstream {route} returned {status}")]
    UpstreamStatus { status: u16, route: &'static str },
    /// The kill switch file says `on` (or cannot be read).
    #[error("chat kill switch is on")]
    KillSwitchOn,
    /// A reservation would exceed the daily or monthly token budget.
    #[error("token budget exhausted")]
    BudgetExhausted,
    /// The meter store failed; turns fail closed.
    #[error("token meter unavailable")]
    MeterUnavailable,
    #[error("upstream timed out")]
    UpstreamTimeout,
    #[error("upstream unavailable: {0}")]
    UpstreamUnavailable(#[source] reqwest::Error),
    #[error("internal error: {0}")]
    Internal(&'static str),
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
            Self::GuardrailBlocked => (StatusCode::BAD_REQUEST, "guardrail_blocked"),
            Self::UpstreamStatus { .. } => (StatusCode::BAD_GATEWAY, "upstream_error"),
            Self::KillSwitchOn => (StatusCode::SERVICE_UNAVAILABLE, "kill_switch_on"),
            Self::BudgetExhausted => (StatusCode::SERVICE_UNAVAILABLE, "budget_exhausted"),
            Self::MeterUnavailable => (StatusCode::SERVICE_UNAVAILABLE, "meter_unavailable"),
            Self::UpstreamTimeout => (StatusCode::GATEWAY_TIMEOUT, "upstream_timeout"),
            Self::UpstreamUnavailable(_) => (StatusCode::BAD_GATEWAY, "upstream_unavailable"),
            Self::Internal(_) => (StatusCode::INTERNAL_SERVER_ERROR, "internal_error"),
        }
    }
}

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        let (status, code) = self.status_and_code();
        // These were logged where they happened, with their context.
        let logged = matches!(
            self,
            Self::UpstreamStatus { .. }
                | Self::KillSwitchOn
                | Self::BudgetExhausted
                | Self::MeterUnavailable
        );
        if status.is_server_error() && !logged {
            tracing::warn!(error = %self, "proxy error");
        }
        let message = match &self {
            Self::BadRequest(detail) | Self::PayloadTooLarge(detail) => (*detail).to_owned(),
            Self::GuardrailBlocked => GUARDRAIL_MESSAGE.to_owned(),
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
