// TJ-ARCH-MOB-001 compliant
//! Handlers for the audited UAR routes (relative to `/api`). Methods are
//! fixed per route; any other method gets 405, any other path 404.

use axum::Router;
use axum::body::Bytes;
use axum::extract::{Path, RawQuery, State};
use axum::http::HeaderMap;
use axum::middleware::from_fn_with_state;
use axum::response::Response;
use axum::routing::{delete, get, post};

use crate::error::AppError;
use crate::interface::middleware::rate_limit;
use crate::interface::state::AppState;

pub fn routes(state: &AppState) -> Router<AppState> {
    let chat = Router::new()
        .route("/chat/completion", post(chat_completion))
        .route_layer(from_fn_with_state(state.chat_limit.clone(), rate_limit));
    let other = Router::new()
        .route("/sessions/{id}/messages", get(session_messages))
        .route("/sessions/{id}", delete(delete_session))
        .route(
            "/uar/runs/{run_id}/artifact-response",
            post(artifact_response),
        )
        .route_layer(from_fn_with_state(state.api_limit.clone(), rate_limit));
    chat.merge(other)
}

async fn chat_completion(
    State(state): State<AppState>,
    headers: HeaderMap,
    body: Bytes,
) -> Result<Response, AppError> {
    state.proxy.chat(&headers, &body).await
}

async fn session_messages(
    State(state): State<AppState>,
    Path(id): Path<String>,
    RawQuery(query): RawQuery,
    headers: HeaderMap,
) -> Result<Response, AppError> {
    state
        .proxy
        .session_messages(&id, query.as_deref(), &headers)
        .await
}

async fn delete_session(
    State(state): State<AppState>,
    Path(id): Path<String>,
    headers: HeaderMap,
) -> Result<Response, AppError> {
    state.proxy.delete_session(&id, &headers).await
}

async fn artifact_response(
    State(state): State<AppState>,
    Path(run_id): Path<String>,
    headers: HeaderMap,
    body: Bytes,
) -> Result<Response, AppError> {
    state.proxy.artifact_response(&run_id, &headers, body).await
}
