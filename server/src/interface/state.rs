// TJ-ARCH-MOB-001 compliant
use std::sync::Arc;

use crate::application::site_proxy::SiteProxy;
use crate::infrastructure::assets::AssetSource;
use crate::infrastructure::rate_limit::ClientRateLimiter;

/// Shared per-process state; every field is cheap to clone.
#[derive(Debug, Clone)]
pub struct AppState {
    pub proxy: Arc<SiteProxy>,
    pub assets: Arc<AssetSource>,
    pub chat_limit: Arc<RouteLimit>,
    pub api_limit: Arc<RouteLimit>,
}

/// One limiter plus how to find the client address in front of it.
#[derive(Debug)]
pub struct RouteLimit {
    pub limiter: ClientRateLimiter,
    pub trusted_proxy_hops: usize,
}
