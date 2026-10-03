// TJ-ARCH-MOB-001 compliant
//! The public site's path to UAR: the audited route set, each call stripped
//! of client credentials and carrying only the proxy's own key.
//!
//! Audited routes (openspec/changes/site-chat-proxy/tasks.md, 1.3):
//! `POST /api/chat/completion`, `GET /api/sessions/{id}/messages`,
//! `DELETE /api/sessions/{id}`, `POST /api/uar/runs/{run_id}/artifact-response`.

use axum::body::Bytes;
use axum::http::header::CONTENT_TYPE;
use axum::http::{HeaderMap, HeaderValue, Method};
use axum::response::Response;

use crate::domain::chat_request::{ChatRequestError, build_site_chat_request};
use crate::domain::forwarding::upstream_request_headers;
use crate::domain::path_id::is_valid_path_id;
use crate::error::AppError;
use crate::infrastructure::upstream::UarClient;

#[derive(Debug)]
pub struct SiteProxy {
    uar: UarClient,
    agent_id: String,
    api_key: Option<HeaderValue>,
}

impl SiteProxy {
    pub fn new(uar: UarClient, agent_id: String, api_key: Option<HeaderValue>) -> Self {
        Self {
            uar,
            agent_id,
            api_key,
        }
    }

    /// Only `application/json` is accepted: `text/plain` is a CORS-simple
    /// type, so accepting it would let any third-party page spend chat quota
    /// from its visitors' browsers without a preflight.
    pub async fn chat(&self, headers: &HeaderMap, body: &[u8]) -> Result<Response, AppError> {
        if !is_json(headers) {
            return Err(AppError::UnsupportedMediaType);
        }
        let pinned = build_site_chat_request(body, &self.agent_id).map_err(chat_error)?;
        // The body was re-serialized here, so its type is ours to state.
        let mut upstream = headers.clone();
        upstream.insert(CONTENT_TYPE, HeaderValue::from_static("application/json"));
        self.forward(
            Method::POST,
            "/api/chat/completion".to_owned(),
            &upstream,
            Bytes::from(pinned),
        )
        .await
    }

    pub async fn session_messages(
        &self,
        session_id: &str,
        query: Option<&str>,
        headers: &HeaderMap,
    ) -> Result<Response, AppError> {
        let id = checked_id(session_id)?;
        let path = match query {
            Some(q) => format!("/api/sessions/{id}/messages?{q}"),
            None => format!("/api/sessions/{id}/messages"),
        };
        self.forward(Method::GET, path, headers, Bytes::new()).await
    }

    pub async fn delete_session(
        &self,
        session_id: &str,
        headers: &HeaderMap,
    ) -> Result<Response, AppError> {
        let id = checked_id(session_id)?;
        self.forward(
            Method::DELETE,
            format!("/api/sessions/{id}"),
            headers,
            Bytes::new(),
        )
        .await
    }

    pub async fn artifact_response(
        &self,
        run_id: &str,
        headers: &HeaderMap,
        body: Bytes,
    ) -> Result<Response, AppError> {
        let id = checked_id(run_id)?;
        self.forward(
            Method::POST,
            format!("/api/uar/runs/{id}/artifact-response"),
            headers,
            body,
        )
        .await
    }

    pub async fn upstream_ready(&self) -> bool {
        self.uar.is_ready().await
    }

    async fn forward(
        &self,
        method: Method,
        path: String,
        headers: &HeaderMap,
        body: Bytes,
    ) -> Result<Response, AppError> {
        let upstream_headers = upstream_request_headers(headers, self.api_key.as_ref());
        self.uar.send(method, &path, upstream_headers, body).await
    }
}

fn chat_error(err: ChatRequestError) -> AppError {
    match err {
        ChatRequestError::MessageTooLong => AppError::PayloadTooLarge("`message` is too long"),
        ChatRequestError::InvalidJson => AppError::BadRequest("request body is not valid JSON"),
        ChatRequestError::NotAnObject => AppError::BadRequest("request body must be a JSON object"),
        ChatRequestError::InvalidMessage => AppError::BadRequest("`message` must be a string"),
        ChatRequestError::InvalidStream => AppError::BadRequest("`stream` must be a boolean"),
        ChatRequestError::InvalidStreamMode => {
            AppError::BadRequest("`stream_mode` must be one of dual, agui, agui_spec")
        }
    }
}

fn is_json(headers: &HeaderMap) -> bool {
    headers
        .get(CONTENT_TYPE)
        .and_then(|v| v.to_str().ok())
        .and_then(|v| v.split(';').next())
        .is_some_and(|mime| mime.trim().eq_ignore_ascii_case("application/json"))
}

fn checked_id(id: &str) -> Result<&str, AppError> {
    if is_valid_path_id(id) {
        Ok(id)
    } else {
        Err(AppError::BadRequest("invalid id in path"))
    }
}
