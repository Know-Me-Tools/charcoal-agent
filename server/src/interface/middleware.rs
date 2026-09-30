// TJ-ARCH-MOB-001 compliant
//! Per-route rate limiting keyed on the resolved client IP.

use std::net::{IpAddr, Ipv4Addr, SocketAddr};
use std::sync::Arc;

use axum::extract::{ConnectInfo, Request, State};
use axum::middleware::Next;
use axum::response::{IntoResponse, Response};

use crate::domain::client_ip::{rate_limit_key, resolve_client_ip};
use crate::error::AppError;
use crate::interface::state::RouteLimit;

pub async fn rate_limit(
    State(limit): State<Arc<RouteLimit>>,
    request: Request,
    next: Next,
) -> Response {
    // Served with connect info in production; without it every caller shares
    // the unspecified-address bucket, which fails closed rather than open.
    let peer = request
        .extensions()
        .get::<ConnectInfo<SocketAddr>>()
        .map_or(IpAddr::V4(Ipv4Addr::UNSPECIFIED), |c| c.0.ip());
    let forwarded: Vec<&str> = request
        .headers()
        .get_all("x-forwarded-for")
        .iter()
        .filter_map(|v| v.to_str().ok())
        .collect();
    let client = resolve_client_ip(peer, &forwarded, limit.trusted_proxy_hops);

    match limit.limiter.check(rate_limit_key(client)) {
        Ok(()) => next.run(request).await,
        Err(wait) => {
            tracing::info!(%client, "rate limited");
            AppError::RateLimited {
                retry_after_secs: wait.as_secs_f64().ceil() as u64,
            }
            .into_response()
        }
    }
}
