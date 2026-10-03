// TJ-ARCH-MOB-001 compliant
//! Handler for the one proxied UAR route (relative to `/api`). Other methods
//! get 405; every other `/api` path, including the removed
//! `/sessions/{id}`, `/sessions/{id}/messages` and
//! `/uar/runs/{run_id}/artifact-response`, gets the generic 404.

use axum::Router;
use axum::body::Bytes;
use axum::extract::{RawQuery, State};
use axum::http::HeaderMap;
use axum::http::header::SET_COOKIE;
use axum::middleware::from_fn_with_state;
use axum::response::{IntoResponse, Response};
use axum::routing::post;

use crate::interface::middleware::rate_limit;
use crate::interface::state::AppState;
use crate::interface::visitor_cookie::{presented_tokens, set_cookie};

pub fn routes(state: &AppState) -> Router<AppState> {
    Router::new()
        .route("/chat/completion", post(chat_completion))
        .route_layer(from_fn_with_state(state.chat_limit.clone(), rate_limit))
}

async fn chat_completion(
    State(state): State<AppState>,
    RawQuery(query): RawQuery,
    headers: HeaderMap,
    body: Bytes,
) -> Response {
    let visitor = match state.proxy.identify_visitor(presented_tokens(&headers)) {
        Ok(visitor) => visitor,
        Err(err) => return err.into_response(),
    };
    let mut response = state
        .proxy
        .chat(&visitor.id, &headers, query.as_deref(), &body)
        .await
        .into_response();
    // Issued on any outcome, so the visitor's next request is bound.
    if let Some(token) = visitor.new_token {
        match set_cookie(&token) {
            Some(value) => {
                response.headers_mut().append(SET_COOKIE, value);
            }
            None => tracing::error!("visitor cookie is not a valid header value"),
        }
    }
    response
}
