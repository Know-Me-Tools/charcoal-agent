// TJ-ARCH-MOB-001 compliant
//! HTTP: the MCP endpoint, its guard, and the probes.

pub mod auth;
pub mod mcp;
pub mod state;

use std::sync::Arc;

use axum::Router;
use axum::extract::DefaultBodyLimit;
use axum::middleware::from_fn_with_state;
use axum::routing::get;
use serde_json::json;

use crate::interface::auth::McpAuth;
use crate::interface::state::AppState;

/// One JSON-RPC message with a 200-character query is well under 1 KB.
const MAX_REQUEST_BYTES: usize = 16 * 1024;

pub fn router(state: AppState, auth: Arc<McpAuth>) -> Router {
    let mcp = Router::new()
        .route(
            "/mcp",
            axum::routing::post(mcp::post_mcp)
                .get(mcp::method_not_allowed)
                .delete(mcp::method_not_allowed),
        )
        .route_layer(from_fn_with_state(auth, auth::guard))
        .with_state(state);
    Router::new()
        .route("/healthz", get(probe))
        .route("/readyz", get(probe))
        .merge(mcp)
        .layer(DefaultBodyLimit::max(MAX_REQUEST_BYTES))
}

/// Liveness and readiness: the process serves. Readiness does not call the
/// upstream (that would spend a search).
async fn probe() -> axum::Json<serde_json::Value> {
    axum::Json(json!({ "status": "ok" }))
}
