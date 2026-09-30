// TJ-ARCH-MOB-001 compliant
//! HTTP client for the Universal Agent Runtime.

use std::time::Duration;

use axum::body::{Body, Bytes};
use axum::http::{HeaderMap, Method};
use axum::response::Response;

use crate::domain::forwarding::client_response_headers;
use crate::error::AppError;

const CONNECT_TIMEOUT: Duration = Duration::from_secs(5);
/// Longest silence tolerated between upstream bytes. A model can think for a
/// while before the first SSE event; UAR's own keep-alives arrive well within.
const READ_IDLE_TIMEOUT: Duration = Duration::from_secs(300);
const READY_PROBE_TIMEOUT: Duration = Duration::from_secs(2);

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

    /// Sends one request and returns the upstream response with its body
    /// streamed, not collected. Dropping the returned body (client
    /// disconnect) drops the upstream connection with it.
    pub async fn send(
        &self,
        method: Method,
        path_and_query: &str,
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

fn classify(err: reqwest::Error) -> AppError {
    if err.is_timeout() {
        AppError::UpstreamTimeout
    } else {
        AppError::UpstreamUnavailable(err)
    }
}
