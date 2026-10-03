// TJ-ARCH-MOB-001 compliant
//! KnowMe site server: hosts the embedded SPA and is the only public path to
//! the UAR site agent.
//!
//! Layers: `interface` (HTTP) -> `application` (use cases) -> `domain` (pure
//! policy) <- `infrastructure` (UAR client, assets, limiter).

pub mod application;
pub mod config;
pub mod domain;
pub mod error;
pub mod infrastructure;
pub mod interface;

use std::sync::Arc;
use std::time::Duration;

use axum::Router;
use axum::http::HeaderValue;

use crate::application::site_proxy::SiteProxy;
use crate::config::Config;
use crate::infrastructure::assets::AssetSource;
use crate::infrastructure::rate_limit::ClientRateLimiter;
use crate::infrastructure::upstream::UarClient;
use crate::interface::state::{AppState, RouteLimit};

const LIMITER_EVICTION_INTERVAL: Duration = Duration::from_secs(60);

#[derive(Debug, thiserror::Error)]
pub enum StartupError {
    #[error("cannot build the UAR HTTP client: {0}")]
    HttpClient(#[from] reqwest::Error),
    #[error("SITE_PROXY_API_KEY is not a valid header value")]
    ApiKey,
}

/// Builds the state and router. Call inside a Tokio runtime: it spawns the
/// limiter eviction task.
pub fn build_app(config: &Config) -> Result<Router, StartupError> {
    let api_key = config
        .site_proxy_api_key
        .as_deref()
        .map(|key| {
            let mut value = HeaderValue::from_str(key).map_err(|_| StartupError::ApiKey)?;
            value.set_sensitive(true);
            Ok::<_, StartupError>(value)
        })
        .transpose()?;
    let uar = UarClient::new(config.uar_upstream.clone())?;
    let limits = config.rate_limits;
    let state = AppState {
        proxy: Arc::new(SiteProxy::new(uar, config.site_agent_id.clone(), api_key)),
        assets: Arc::new(AssetSource::from_web_root(config.web_root.clone())),
        chat_limit: Arc::new(RouteLimit {
            limiter: ClientRateLimiter::new(limits.chat_per_minute, limits.chat_burst),
            trusted_proxy_hops: config.trusted_proxy_hops,
        }),
        api_limit: Arc::new(RouteLimit {
            limiter: ClientRateLimiter::new(limits.api_per_minute, limits.api_burst),
            trusted_proxy_hops: config.trusted_proxy_hops,
        }),
    };
    spawn_limiter_eviction(&state);
    Ok(interface::routes::router(state))
}

fn spawn_limiter_eviction(state: &AppState) {
    let (chat, api) = (
        Arc::downgrade(&state.chat_limit),
        Arc::downgrade(&state.api_limit),
    );
    tokio::spawn(async move {
        let mut tick = tokio::time::interval(LIMITER_EVICTION_INTERVAL);
        loop {
            tick.tick().await;
            // Stops once the router (and its state) is gone.
            let (Some(chat), Some(api)) = (chat.upgrade(), api.upgrade()) else {
                break;
            };
            chat.limiter.evict_idle();
            api.limiter.evict_idle();
        }
    });
}
