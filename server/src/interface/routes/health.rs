// TJ-ARCH-MOB-001 compliant
//! Probes. `/healthz` is local liveness; `/readyz` also needs UAR and assets.

use axum::Json;
use axum::extract::State;
use axum::http::StatusCode;
use axum::response::IntoResponse;
use serde_json::json;

use crate::interface::state::AppState;

pub async fn healthz() -> impl IntoResponse {
    Json(json!({ "status": "ok" }))
}

pub async fn readyz(State(state): State<AppState>) -> impl IntoResponse {
    let assets = state.assets.is_ready();
    let upstream = state.proxy.upstream_ready().await;
    let ready = assets && upstream;
    let status = if ready {
        StatusCode::OK
    } else {
        StatusCode::SERVICE_UNAVAILABLE
    };
    let body = json!({ "status": if ready { "ok" } else { "error" }, "assets": assets, "upstream": upstream });
    (status, Json(body))
}
