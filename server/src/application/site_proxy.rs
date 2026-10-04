// TJ-ARCH-MOB-001 compliant
//! The public site's path to UAR. One route survives the audit
//! (site-chat-proxy 1.3, trimmed by site-proxy-hardening):
//! `POST /api/chat/completion`. Each call is rebuilt from an allowlist,
//! stripped of client credentials, bound to the visitor's upstream session,
//! is admitted by the spend meter, carries only the proxy's own credential
//! (added by the UAR client), and
//! streams back through the internal-artifact filter and the turn tracker.
//!
//! Stream resume (UAR: the same route with `x-uar-run-id` and
//! `Last-Event-ID`) is not forwarded yet (`site-stream-resume`); when it is,
//! it goes through `chat` and so gets the same derived session header.

use std::sync::Arc;
use std::time::Instant;

use axum::body::{Body, Bytes};
use axum::http::header::CONTENT_TYPE;
use axum::http::{HeaderMap, HeaderValue, Method};
use axum::response::Response;

use crate::application::meter::{Meter, TurnTracker};
use crate::application::public_stream::{UpstreamTap, filter_internal_artifacts};
use crate::domain::chat_request::{ChatRequestError, build_site_chat_request};
use crate::domain::forwarding::{SESSION_HEADER, upstream_request_headers};
use crate::domain::meter::Outcome;
use crate::domain::query::allowlisted_query;
use crate::domain::session_binding::{SessionSecret, ThreadId, VISITOR_ID_BYTES, VisitorId};
use crate::error::AppError;
use crate::infrastructure::upstream::UarClient;

const CHAT_PATH: &str = "/api/chat/completion";
/// Client query parameters forwarded on the chat route: none.
const CHAT_QUERY_PARAMS: &[&str] = &[];

#[derive(Debug)]
pub struct SiteProxy {
    uar: UarClient,
    agent_id: String,
    secret: SessionSecret,
    meter: Arc<Meter>,
    /// Always `None` outside the `test-harness` build.
    tap: Option<UpstreamTap>,
}

/// The visitor behind a request. `new_token` is set when the request carried
/// no valid cookie: the caller must issue it.
#[derive(Debug)]
pub struct Visitor {
    pub id: VisitorId,
    pub new_token: Option<String>,
}

impl SiteProxy {
    pub fn new(uar: UarClient, agent_id: String, secret: SessionSecret, meter: Arc<Meter>) -> Self {
        Self {
            uar,
            agent_id,
            secret,
            meter,
            tap: None,
        }
    }

    /// FR-11 harness seam: observe the upstream chat stream before the filter.
    #[cfg(feature = "test-harness")]
    pub fn with_upstream_tap(mut self, tap: UpstreamTap) -> Self {
        self.tap = Some(tap);
        self
    }

    /// The first presented cookie value whose signature verifies names the
    /// visitor. Otherwise a new visitor id is minted; a cookie that fails
    /// verification is replaced, never trusted.
    pub fn identify_visitor<'a>(
        &self,
        presented: impl IntoIterator<Item = &'a str>,
    ) -> Result<Visitor, AppError> {
        if let Some(id) = presented
            .into_iter()
            .find_map(|token| self.secret.verify_visitor_token(token))
        {
            return Ok(Visitor {
                id,
                new_token: None,
            });
        }
        let mut bytes = [0u8; VISITOR_ID_BYTES];
        getrandom::fill(&mut bytes).map_err(|_| AppError::Internal("random source failed"))?;
        let id = VisitorId::from_bytes(bytes);
        Ok(Visitor {
            new_token: Some(self.secret.visitor_token(&id)),
            id,
        })
    }

    /// Only `application/json` is accepted: `text/plain` is a CORS-simple
    /// type, so accepting it would let any third-party page spend chat quota
    /// from its visitors' browsers without a preflight. Every check, then the
    /// kill switch and the meter reservation, runs before the upstream call.
    pub async fn chat(
        &self,
        visitor: &VisitorId,
        headers: &HeaderMap,
        query: Option<&str>,
        body: &[u8],
    ) -> Result<Response, AppError> {
        let accepted = Instant::now();
        if !is_json(headers) {
            return Err(AppError::UnsupportedMediaType);
        }
        let thread = thread_id(headers)?;
        let pinned = build_site_chat_request(body, &self.agent_id).map_err(chat_error)?;

        let mut session = HeaderValue::from_str(&self.secret.upstream_session_id(visitor, &thread))
            .map_err(|_| AppError::Internal("derived session id is not a header value"))?;
        session.set_sensitive(true);
        let mut upstream = upstream_request_headers(headers, session);
        // The body was re-serialized here, so its type is ours to state.
        upstream.insert(CONTENT_TYPE, HeaderValue::from_static("application/json"));

        let path = match allowlisted_query(query, CHAT_QUERY_PARAMS) {
            Some(q) => format!("{CHAT_PATH}?{q}"),
            None => CHAT_PATH.to_owned(),
        };
        let reservation = self.meter.admit().await?;
        let mut tracker = self.meter.tracker(reservation, accepted);
        let sent = self
            .uar
            .send(
                Method::POST,
                &path,
                CHAT_PATH,
                upstream,
                Bytes::from(pinned),
            )
            .await;
        match sent {
            Ok(response) => Ok(self.public_stream(response, tracker)),
            Err(err) => {
                tracker.finish(Outcome::UpstreamError);
                Err(err)
            }
        }
    }

    pub async fn upstream_ready(&self) -> bool {
        self.uar.is_ready().await
    }

    /// Runs an SSE body through the internal-artifact filter and the turn
    /// tracker. Any other body passes unchanged and keeps its reservation.
    fn public_stream(&self, response: Response, mut tracker: TurnTracker) -> Response {
        if !is_event_stream(response.headers()) {
            tracker.finish(Outcome::Incomplete);
            return response;
        }
        let (parts, body) = response.into_parts();
        let filtered =
            filter_internal_artifacts(body.into_data_stream(), self.tap.clone(), Some(tracker));
        Response::from_parts(parts, Body::from_stream(filtered))
    }
}

/// The client's thread id: exactly one `X-UAR-Session-ID`, a UUIDv4.
fn thread_id(headers: &HeaderMap) -> Result<ThreadId, AppError> {
    let mut values = headers.get_all(SESSION_HEADER).iter();
    let (Some(value), None) = (values.next(), values.next()) else {
        return Err(AppError::BadRequest(
            "exactly one `X-UAR-Session-ID` header is required",
        ));
    };
    value
        .to_str()
        .ok()
        .and_then(ThreadId::parse)
        .ok_or(AppError::BadRequest("`X-UAR-Session-ID` must be a UUIDv4"))
}

fn chat_error(err: ChatRequestError) -> AppError {
    match err {
        ChatRequestError::MessageTooLong => AppError::PayloadTooLarge("`message` is too long"),
        ChatRequestError::InvalidJson => AppError::BadRequest("request body is not valid JSON"),
        ChatRequestError::NotAnObject => AppError::BadRequest("request body must be a JSON object"),
        ChatRequestError::InvalidMessage => AppError::BadRequest("`message` must be a string"),
    }
}

fn is_json(headers: &HeaderMap) -> bool {
    media_type(headers).is_some_and(|mime| mime.eq_ignore_ascii_case("application/json"))
}

fn is_event_stream(headers: &HeaderMap) -> bool {
    media_type(headers).is_some_and(|mime| mime.eq_ignore_ascii_case("text/event-stream"))
}

fn media_type(headers: &HeaderMap) -> Option<&str> {
    headers
        .get(CONTENT_TYPE)
        .and_then(|v| v.to_str().ok())
        .and_then(|v| v.split(';').next())
        .map(str::trim)
}
