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

use crate::application::meter::Meter;
#[cfg(feature = "test-harness")]
pub use crate::application::public_stream::UpstreamTap;
use crate::application::site_proxy::SiteProxy;
use crate::config::Config;
use crate::infrastructure::a2ui_optin::A2uiOptIn;
use crate::infrastructure::assets::AssetSource;
use crate::infrastructure::kill_switch::KillSwitch;
use crate::infrastructure::meter_store::MeterStore;
use crate::infrastructure::rate_limit::ClientRateLimiter;
use crate::infrastructure::upstream::{UarClient, UpstreamCredential};
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
    Ok(router(build_proxy(config)?, config))
}

/// FR-11 harness (`test-harness` feature only, never in a release build):
/// the same app, with `tap` receiving every upstream chat SSE chunk before
/// the public-path artifact filter.
#[cfg(feature = "test-harness")]
pub fn build_app_with_upstream_tap(
    config: &Config,
    tap: UpstreamTap,
) -> Result<Router, StartupError> {
    Ok(router(build_proxy(config)?.with_upstream_tap(tap), config))
}

fn build_proxy(config: &Config) -> Result<SiteProxy, StartupError> {
    let uar = UarClient::new(config.uar_upstream.clone(), upstream_credential(config)?)?;
    let kill_switch = Arc::new(KillSwitch::new(config.kill_switch_file.clone()));
    KillSwitch::spawn_watcher(&kill_switch);
    let meter = Meter::new(
        MeterStore::new(config.meter.store.clone())?,
        config.meter.budgets,
        config.meter.reservation_tokens,
        kill_switch,
    );
    let a2ui_optin = Arc::new(A2uiOptIn::new(config.a2ui_optin_file.clone()));
    A2uiOptIn::spawn_watcher(&a2ui_optin);
    Ok(SiteProxy::new(
        uar,
        config.site_agent_id.clone(),
        config.session_secret.clone(),
        Arc::new(meter),
        a2ui_optin,
    ))
}

/// Gate mode wins over the static key; see `config.rs`.
fn upstream_credential(config: &Config) -> Result<UpstreamCredential, StartupError> {
    if let Some(gate) = &config.gate {
        return Ok(UpstreamCredential::Gate(gate.clone()));
    }
    match config.site_proxy_api_key.as_deref() {
        None => Ok(UpstreamCredential::None),
        Some(key) => {
            let mut value = HeaderValue::from_str(key).map_err(|_| StartupError::ApiKey)?;
            value.set_sensitive(true);
            Ok(UpstreamCredential::ApiKey(value))
        }
    }
}

fn router(proxy: SiteProxy, config: &Config) -> Router {
    let limits = config.rate_limits;
    let state = AppState {
        proxy: Arc::new(proxy),
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
    interface::routes::router(state)
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
