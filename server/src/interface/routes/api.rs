// TJ-ARCH-MOB-001 compliant
//! Extension point for the site's own APIs (served by this server, not UAR).
//!
//! Add routes here relative to `/api`, e.g. `.route("/contact", post(...))`,
//! each with a use case in `application/`. They inherit the 32 KiB body
//! limit and the `/api` 404 fallback; add a `rate_limit` route layer (see
//! `uar_proxy::routes`) to anything reachable by the public.

use axum::Router;

use crate::interface::state::AppState;

pub fn routes() -> Router<AppState> {
    Router::new()
}
