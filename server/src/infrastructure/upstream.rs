// TJ-ARCH-MOB-001 compliant
//! HTTP client for the Universal Agent Runtime.

use std::time::Duration;

use axum::body::{Body, Bytes};
use axum::http::{HeaderMap, Method, StatusCode};
use axum::response::Response;
use serde_json::Value;

use crate::domain::forwarding::client_response_headers;
use crate::error::AppError;

const CONNECT_TIMEOUT: Duration = Duration::from_secs(5);
/// Longest silence tolerated between upstream bytes. A model can think for a
/// while before the first SSE event; UAR's own keep-alives arrive well within.
const READ_IDLE_TIMEOUT: Duration = Duration::from_secs(300);
const READY_PROBE_TIMEOUT: Duration = Duration::from_secs(2);
/// Most of an upstream 400 body read to look for `guardrail_blocked`. UAR's
/// guardrail body is under 200 bytes.
const MAX_ERROR_BODY_BYTES: usize = 16 * 1024;
/// UAR `src/server.rs`: `{"error":{"type":"guardrail_blocked", ...}}`.
const GUARDRAIL_ERROR_TYPE: &str = "guardrail_blocked";

#[derive(Debug, Clone)]
pub struct UarClient {
    http: reqwest::Client,
    base: String,
}

impl UarClient {
    pub fn new(base: String) -> Result<Self, reqwest::Error> {
        let http = reqwest::Client::builder()
            .connect_timeout(CONNECT_TIMEOUT)
            .read_timeout(READ_IDLE_TIMEOUT)
            // Never follow a redirect with the proxy key attached.
            .redirect(reqwest::redirect::Policy::none())
            // reqwest reads HTTP_PROXY/http_proxy from the env even without the
            // system-proxy feature; an ambient proxy must never see the key.
            .no_proxy()
            .build()?;
        Ok(Self { http, base })
    }

    /// Sends one request. A 2xx comes back with its body streamed, not
    /// collected; dropping that body (client disconnect) drops the upstream
    /// connection with it. Any other status becomes a generic error: UAR's
    /// status and body never reach the browser. `route` is the path template
    /// logged in place of the real path (no ids, no query).
    pub async fn send(
        &self,
        method: Method,
        path_and_query: &str,
        route: &'static str,
        headers: HeaderMap,
        body: Bytes,
    ) -> Result<Response, AppError> {
        let upstream = self
            .http
            .request(method, format!("{}{path_and_query}", self.base))
            .headers(headers)
            .body(body)
            .send()
            .await
            .map_err(classify)?;

        let status = upstream.status();
        if !status.is_success() {
            return Err(upstream_error(status, route, upstream).await);
        }
        let headers = client_response_headers(upstream.headers());
        let mut response = Response::new(Body::from_stream(upstream.bytes_stream()));
        *response.status_mut() = status;
        *response.headers_mut() = headers;
        Ok(response)
    }

    /// True when UAR answers `/readyz` with a 2xx within the probe timeout.
    pub async fn is_ready(&self) -> bool {
        self.http
            .get(format!("{}/readyz", self.base))
            .timeout(READY_PROBE_TIMEOUT)
            .send()
            .await
            .is_ok_and(|r| r.status().is_success())
    }
}

/// Logs the status and route only (never the session id or the body) and
/// returns the generic error for the browser.
async fn upstream_error(
    status: StatusCode,
    route: &'static str,
    response: reqwest::Response,
) -> AppError {
    let code = status.as_u16();
    if status == StatusCode::BAD_REQUEST && is_guardrail_block(response).await {
        tracing::info!(
            status = code,
            route,
            "upstream guardrail blocked the request"
        );
        return AppError::GuardrailBlocked;
    }
    if status.is_server_error() {
        tracing::warn!(status = code, route, "upstream error");
    } else {
        tracing::info!(status = code, route, "upstream rejected the request");
    }
    AppError::UpstreamStatus {
        status: code,
        route,
    }
}

async fn is_guardrail_block(mut response: reqwest::Response) -> bool {
    let mut body = Vec::new();
    while let Ok(Some(chunk)) = response.chunk().await {
        body.extend_from_slice(&chunk);
        if body.len() > MAX_ERROR_BODY_BYTES {
            return false;
        }
    }
    is_guardrail_body(&body)
}

fn is_guardrail_body(body: &[u8]) -> bool {
    serde_json::from_slice::<Value>(body).is_ok_and(|v| {
        v.pointer("/error/type").and_then(Value::as_str) == Some(GUARDRAIL_ERROR_TYPE)
    })
}

fn classify(err: reqwest::Error) -> AppError {
    if err.is_timeout() {
        AppError::UpstreamTimeout
    } else {
        AppError::UpstreamUnavailable(err)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn uar_guardrail_body_should_be_recognised() {
        let uar = br#"{"error":{"message":"Input rejected by guardrail policy","type":"guardrail_blocked","code":"guardrail_injection_blocked"}}"#;
        assert!(is_guardrail_body(uar));
    }

    #[test]
    fn other_400_bodies_should_not_be_recognised() {
        for body in [
            &br#"{"error":{"type":"invalid_request_error"}}"#[..],
            br#"{"error":"guardrail_blocked"}"#,
            br#"{"type":"guardrail_blocked"}"#,
            b"guardrail_blocked",
            b"",
        ] {
            assert!(
                !is_guardrail_body(body),
                "{}",
                String::from_utf8_lossy(body)
            );
        }
    }
}
