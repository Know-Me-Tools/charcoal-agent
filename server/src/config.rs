// TJ-ARCH-MOB-001 compliant
//! Runtime configuration, read once from the environment at startup.
//!
//! `SITE_SESSION_SECRET` (required, at least 32 bytes, e.g. the output of
//! `openssl rand -base64 48`) keys the visitor cookie signature and the
//! upstream session derivation (`domain::session_binding`). Every replica
//! must hold the same value. In Kubernetes it comes from a Secret, never a
//! ConfigMap or the image.
//!
//! Rotation: changing the secret invalidates every visitor cookie and maps
//! every thread to a new upstream session, so all server-side sessions are
//! orphaned at once. Visitors keep their local thread history and continue
//! in fresh sessions; the purge (`site-session-erasure`) deletes the
//! orphans. Rotate by replacing the Secret and restarting all replicas
//! together; replicas on different secrets would split one visitor across
//! two upstream sessions.
//!
//! Spend meter (site-spend-ceiling):
//! - `SITE_METER_URL` (required): SurrealDB base URL, `http://` only, e.g.
//!   `http://surrealdb:8000`.
//! - `SITE_METER_USER`, `SITE_METER_PASS` (required): the database user
//!   defined `ON DATABASE` for `site/meter` only, created out of band by the
//!   operator; from a Secret.
//! - `SITE_METER_NS`, `SITE_METER_DB`: default `site`, `meter`.
//! - `SITE_METER_DAILY_TOKENS`, `SITE_METER_MONTHLY_TOKENS`: D-3 budgets,
//!   default 1,000,000 and 20,000,000.
//! - `SITE_METER_RESERVATION_TOKENS`: the per-turn reservation `n`, default
//!   5,000 = 2 x the agent's `extensions.budgets.max_tokens_per_turn` (2,500
//!   in `uar/agents/knowme-site.json`). Not sized from the model's context
//!   window, which could make one reservation exceed the daily budget. A run
//!   that uses more is charged in full at settlement and alerts
//!   (`meter_excess`), so overshoot stays bounded and measured. UAR's
//!   `max_output_tokens` must be set so one model call stays bounded.
//!   Raise `n` with `max_tokens_per_turn`.
//! - `SITE_KILL_SWITCH_FILE` (required): the mounted kill switch file
//!   (`on`/`off`), from an operator-owned ConfigMap.
//! - `SITE_A2UI_OPTIN_FILE` (optional): the mounted A2UI opt-in file
//!   (`on`/`off`). Unset, missing, unreadable or anything but `on` means the
//!   proxy asks UAR for plain text (`presentation_mode: "text"`).
//!
//! UAR credential (gate-site-credentials 1.4):
//! - Gate mode: `SITE_GATE_TOKEN_URL` (`http://` only, e.g.
//!   `http://flint-gate.flint-core.svc:4456/oauth/token`),
//!   `SITE_GATE_CLIENT_ID` (e.g. `knowme-site`) and `SITE_GATE_CLIENT_SECRET`
//!   (from a Secret). All three set: the proxy sends UAR a gate-minted
//!   bearer and no `X-API-Key`; `SITE_PROXY_API_KEY` is ignored. Some but
//!   not all set: startup fails.
//! - Key mode (none of the three set, e.g. the local compose stack):
//!   `SITE_PROXY_API_KEY` is sent as `X-API-Key`; unset sends nothing.

use std::num::NonZeroU32;
use std::path::PathBuf;

use crate::domain::meter::Budgets;
use crate::domain::session_binding::{MIN_SECRET_BYTES, SessionSecret};
use crate::infrastructure::gate_token::GateConfig;
use crate::infrastructure::meter_store::MeterStoreConfig;

const DEFAULT_DAILY_TOKENS: u64 = 1_000_000;
const DEFAULT_MONTHLY_TOKENS: u64 = 20_000_000;
const DEFAULT_RESERVATION_TOKENS: u64 = 5_000;

const DEFAULT_PORT: u16 = 8080;
const DEFAULT_AGENT_ID: &str = "knowme-site";

#[derive(Debug, thiserror::Error, PartialEq, Eq)]
pub enum ConfigError {
    #[error("UAR_UPSTREAM is required (e.g. http://uar:6565)")]
    MissingUpstream,
    #[error("UAR_UPSTREAM must be an http:// URL without query or fragment: {0}")]
    InvalidUpstream(String),
    #[error("{name} is not a valid value: {value}")]
    InvalidNumber { name: &'static str, value: String },
    #[error("SITE_PROXY_API_KEY contains characters not allowed in an HTTP header")]
    InvalidApiKey,
    #[error("SITE_AGENT_ID must not be empty")]
    EmptyAgentId,
    #[error("SITE_SESSION_SECRET is required (at least {MIN_SECRET_BYTES} bytes)")]
    MissingSessionSecret,
    #[error("SITE_SESSION_SECRET must be at least {MIN_SECRET_BYTES} bytes")]
    WeakSessionSecret,
    #[error("{0} is required")]
    Missing(&'static str),
    #[error("SITE_METER_URL must be an http:// URL without query or fragment: {0}")]
    InvalidMeterUrl(String),
    #[error(
        "gate mode needs SITE_GATE_TOKEN_URL, SITE_GATE_CLIENT_ID and SITE_GATE_CLIENT_SECRET \
         together; missing: {0}"
    )]
    PartialGateConfig(String),
    #[error("SITE_GATE_TOKEN_URL must be an http:// URL without query or fragment: {0}")]
    InvalidGateTokenUrl(String),
    #[error(
        "meter sizes must be positive, with the reservation within the daily budget and the \
         daily budget within the monthly one"
    )]
    InvalidMeterSizes,
}

/// Per-client-IP quotas. GCRA: `per_minute` replenish rate, `burst` capacity.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct RateLimits {
    pub chat_per_minute: NonZeroU32,
    pub chat_burst: NonZeroU32,
    pub api_per_minute: NonZeroU32,
    pub api_burst: NonZeroU32,
}

impl Default for RateLimits {
    fn default() -> Self {
        // Chat turns cost model tokens; everything else is cheap reads/deletes.
        Self {
            chat_per_minute: NonZeroU32::new(10).unwrap_or(NonZeroU32::MIN),
            chat_burst: NonZeroU32::new(5).unwrap_or(NonZeroU32::MIN),
            api_per_minute: NonZeroU32::new(60).unwrap_or(NonZeroU32::MIN),
            api_burst: NonZeroU32::new(20).unwrap_or(NonZeroU32::MIN),
        }
    }
}

#[derive(Debug, Clone)]
pub struct Config {
    pub port: u16,
    /// Base URL without trailing slash, e.g. `http://uar:6565`.
    pub uar_upstream: String,
    /// Sent as `X-API-Key` on every proxied call. `None` sends no credential.
    /// Ignored when `gate` is set.
    pub site_proxy_api_key: Option<String>,
    /// Gate client credentials. When set, UAR gets a gate-minted bearer.
    pub gate: Option<GateConfig>,
    pub site_agent_id: String,
    /// Proxies in front of this server that append to `X-Forwarded-For`.
    pub trusted_proxy_hops: usize,
    /// External asset mode: serve this compiled bundle instead of the embedded one.
    pub web_root: Option<PathBuf>,
    pub rate_limits: RateLimits,
    /// Keys the visitor cookie and the upstream session derivation.
    pub session_secret: SessionSecret,
    pub meter: MeterConfig,
    /// The mounted kill switch file.
    pub kill_switch_file: PathBuf,
    /// The mounted A2UI opt-in file; `None` is permanently off.
    pub a2ui_optin_file: Option<PathBuf>,
}

/// The spend meter's store and sizes.
#[derive(Debug, Clone)]
pub struct MeterConfig {
    pub store: MeterStoreConfig,
    pub budgets: Budgets,
    /// Tokens reserved per turn (`n`).
    pub reservation_tokens: u64,
}

impl Config {
    pub fn from_env() -> Result<Self, ConfigError> {
        Self::from_lookup(|name| std::env::var(name).ok())
    }

    pub fn from_lookup(lookup: impl Fn(&str) -> Option<String>) -> Result<Self, ConfigError> {
        let get = |name: &str| {
            lookup(name)
                .map(|v| v.trim().to_owned())
                .filter(|v| !v.is_empty())
        };

        let uar_upstream =
            parse_upstream(&get("UAR_UPSTREAM").ok_or(ConfigError::MissingUpstream)?)?;
        let site_proxy_api_key = get("SITE_PROXY_API_KEY");
        if site_proxy_api_key
            .as_deref()
            .is_some_and(|k| axum::http::HeaderValue::from_str(k).is_err())
        {
            return Err(ConfigError::InvalidApiKey);
        }
        let site_agent_id = match lookup("SITE_AGENT_ID") {
            None => DEFAULT_AGENT_ID.to_owned(),
            Some(v) if v.trim().is_empty() => return Err(ConfigError::EmptyAgentId),
            Some(v) => v.trim().to_owned(),
        };

        let session_secret = SessionSecret::new(
            lookup("SITE_SESSION_SECRET")
                .filter(|v| !v.is_empty())
                .ok_or(ConfigError::MissingSessionSecret)?
                .as_bytes(),
        )
        .map_err(|_| ConfigError::WeakSessionSecret)?;

        Ok(Self {
            port: parse_number("PORT", get("PORT"), DEFAULT_PORT)?,
            uar_upstream,
            site_proxy_api_key,
            gate: gate_config(&get)?,
            site_agent_id,
            trusted_proxy_hops: parse_number("TRUSTED_PROXY_HOPS", get("TRUSTED_PROXY_HOPS"), 0)?,
            web_root: get("KNOWME_WEB_ROOT").map(PathBuf::from),
            rate_limits: chat_limits(&get)?,
            session_secret,
            meter: meter_config(&get)?,
            kill_switch_file: get("SITE_KILL_SWITCH_FILE")
                .map(PathBuf::from)
                .ok_or(ConfigError::Missing("SITE_KILL_SWITCH_FILE"))?,
            a2ui_optin_file: get("SITE_A2UI_OPTIN_FILE").map(PathBuf::from),
        })
    }
}

const GATE_VARS: [&str; 3] = [
    "SITE_GATE_TOKEN_URL",
    "SITE_GATE_CLIENT_ID",
    "SITE_GATE_CLIENT_SECRET",
];

/// All three gate variables, or none of them.
fn gate_config(get: &impl Fn(&str) -> Option<String>) -> Result<Option<GateConfig>, ConfigError> {
    let [url, id, secret] = GATE_VARS.map(get);
    match (url, id, secret) {
        (None, None, None) => Ok(None),
        (Some(url), Some(client_id), Some(client_secret)) => Ok(Some(GateConfig {
            token_url: parse_token_url(&url)?,
            client_id,
            client_secret,
        })),
        _ => {
            let missing: Vec<_> = GATE_VARS
                .into_iter()
                .filter(|name| get(name).is_none())
                .collect();
            Err(ConfigError::PartialGateConfig(missing.join(", ")))
        }
    }
}

/// The token endpoint is called with the TLS-less UAR client, so `http://`.
fn parse_token_url(raw: &str) -> Result<String, ConfigError> {
    let invalid = || ConfigError::InvalidGateTokenUrl(raw.to_owned());
    let url = reqwest::Url::parse(raw).map_err(|_| invalid())?;
    if url.scheme() != "http"
        || url.host_str().is_none()
        || url.query().is_some()
        || url.fragment().is_some()
    {
        return Err(invalid());
    }
    Ok(url.as_str().to_owned())
}

fn meter_config(get: &impl Fn(&str) -> Option<String>) -> Result<MeterConfig, ConfigError> {
    let required = |name: &'static str| get(name).ok_or(ConfigError::Missing(name));
    let raw_url = required("SITE_METER_URL")?;
    let url = parse_upstream(&raw_url).map_err(|_| ConfigError::InvalidMeterUrl(raw_url))?;
    let budgets = Budgets {
        daily: parse_number(
            "SITE_METER_DAILY_TOKENS",
            get("SITE_METER_DAILY_TOKENS"),
            DEFAULT_DAILY_TOKENS,
        )?,
        monthly: parse_number(
            "SITE_METER_MONTHLY_TOKENS",
            get("SITE_METER_MONTHLY_TOKENS"),
            DEFAULT_MONTHLY_TOKENS,
        )?,
    };
    let reservation_tokens = parse_number(
        "SITE_METER_RESERVATION_TOKENS",
        get("SITE_METER_RESERVATION_TOKENS"),
        DEFAULT_RESERVATION_TOKENS,
    )?;
    // A reservation larger than a budget would refuse every turn.
    if reservation_tokens == 0
        || reservation_tokens > budgets.daily
        || budgets.daily > budgets.monthly
    {
        return Err(ConfigError::InvalidMeterSizes);
    }
    Ok(MeterConfig {
        store: MeterStoreConfig {
            url,
            namespace: get("SITE_METER_NS").unwrap_or_else(|| "site".to_owned()),
            database: get("SITE_METER_DB").unwrap_or_else(|| "meter".to_owned()),
            user: required("SITE_METER_USER")?,
            password: required("SITE_METER_PASS")?,
        },
        budgets,
        reservation_tokens,
    })
}

/// Chat quota overrides. The limiter is in memory per replica, so a
/// deployment with N replicas sets 1/N of the intended per-client quota.
fn chat_limits(get: &impl Fn(&str) -> Option<String>) -> Result<RateLimits, ConfigError> {
    let defaults = RateLimits::default();
    Ok(RateLimits {
        chat_per_minute: parse_number(
            "CHAT_RATE_PER_MIN",
            get("CHAT_RATE_PER_MIN"),
            defaults.chat_per_minute,
        )?,
        chat_burst: parse_number("CHAT_BURST", get("CHAT_BURST"), defaults.chat_burst)?,
        ..defaults
    })
}

fn parse_upstream(raw: &str) -> Result<String, ConfigError> {
    let invalid = || ConfigError::InvalidUpstream(raw.to_owned());
    let url = reqwest::Url::parse(raw).map_err(|_| invalid())?;
    // The client is built without TLS; https would fail on every request.
    if url.scheme() != "http"
        || url.host_str().is_none()
        || url.query().is_some()
        || url.fragment().is_some()
    {
        return Err(invalid());
    }
    Ok(url.as_str().trim_end_matches('/').to_owned())
}

fn parse_number<T: std::str::FromStr>(
    name: &'static str,
    raw: Option<String>,
    default: T,
) -> Result<T, ConfigError> {
    match raw {
        None => Ok(default),
        Some(value) => value
            .parse()
            .map_err(|_| ConfigError::InvalidNumber { name, value }),
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::collections::HashMap;

    const SECRET: &str = "0123456789abcdef0123456789abcdef";

    /// `vars` plus a valid session secret unless `vars` sets one.
    fn config(vars: &[(&str, &str)]) -> Result<Config, ConfigError> {
        let mut map: HashMap<String, String> = vars
            .iter()
            .map(|(k, v)| ((*k).into(), (*v).into()))
            .collect();
        for (name, value) in [
            ("SITE_SESSION_SECRET", SECRET),
            ("SITE_METER_URL", "http://surrealdb:8000"),
            ("SITE_METER_USER", "meter"),
            ("SITE_METER_PASS", "meter-pass"),
            ("SITE_KILL_SWITCH_FILE", "/etc/knowme/kill-switch"),
        ] {
            map.entry(name.into()).or_insert_with(|| value.into());
        }
        Config::from_lookup(|name| map.get(name).cloned())
    }

    #[test]
    fn defaults_should_apply_when_only_upstream_is_set() {
        let cfg = config(&[("UAR_UPSTREAM", "http://uar:6565/")]).unwrap();
        assert_eq!(cfg.rate_limits, RateLimits::default());
        assert_eq!(
            (
                cfg.port,
                cfg.uar_upstream.as_str(),
                cfg.site_agent_id.as_str()
            ),
            (8080, "http://uar:6565", "knowme-site")
        );
        assert_eq!((cfg.trusted_proxy_hops, cfg.site_proxy_api_key), (0, None));
        assert_eq!(cfg.gate, None);
    }

    const GATE_URL: &str = "http://flint-gate.flint-core.svc:4456/oauth/token";

    #[test]
    fn all_three_gate_variables_should_enable_gate_mode() {
        let cfg = config(&[
            ("UAR_UPSTREAM", "http://uar"),
            ("SITE_GATE_TOKEN_URL", GATE_URL),
            ("SITE_GATE_CLIENT_ID", "knowme-site"),
            ("SITE_GATE_CLIENT_SECRET", "gate-secret"),
            ("SITE_PROXY_API_KEY", "legacy-key"),
        ])
        .unwrap();
        assert_eq!(
            cfg.gate,
            Some(GateConfig {
                token_url: GATE_URL.to_owned(),
                client_id: "knowme-site".to_owned(),
                client_secret: "gate-secret".to_owned(),
            })
        );
        assert!(!format!("{cfg:?}").contains("gate-secret"));
    }

    #[test]
    fn partial_gate_variables_should_refuse_to_start() {
        let partial = config(&[
            ("UAR_UPSTREAM", "http://uar"),
            ("SITE_GATE_TOKEN_URL", GATE_URL),
            ("SITE_GATE_CLIENT_SECRET", "gate-secret"),
        ]);
        assert_eq!(
            partial.unwrap_err(),
            ConfigError::PartialGateConfig("SITE_GATE_CLIENT_ID".to_owned())
        );
        let only_id = config(&[
            ("UAR_UPSTREAM", "http://uar"),
            ("SITE_GATE_CLIENT_ID", "knowme-site"),
        ]);
        assert_eq!(
            only_id.unwrap_err(),
            ConfigError::PartialGateConfig(
                "SITE_GATE_TOKEN_URL, SITE_GATE_CLIENT_SECRET".to_owned()
            )
        );
    }

    #[test]
    fn https_or_query_gate_url_should_fail() {
        for url in [
            "https://gate/oauth/token",
            "http://gate/oauth/token?x=1",
            "gate",
        ] {
            let cfg = config(&[
                ("UAR_UPSTREAM", "http://uar"),
                ("SITE_GATE_TOKEN_URL", url),
                ("SITE_GATE_CLIENT_ID", "knowme-site"),
                ("SITE_GATE_CLIENT_SECRET", "gate-secret"),
            ]);
            assert!(
                matches!(cfg, Err(ConfigError::InvalidGateTokenUrl(_))),
                "{url}"
            );
        }
    }

    #[test]
    fn chat_quota_should_be_configurable_and_reject_zero() {
        let cfg = config(&[
            ("UAR_UPSTREAM", "http://uar"),
            ("CHAT_RATE_PER_MIN", "5"),
            ("CHAT_BURST", "3"),
        ])
        .unwrap();
        assert_eq!(
            (
                cfg.rate_limits.chat_per_minute.get(),
                cfg.rate_limits.chat_burst.get()
            ),
            (5, 3)
        );
        assert_eq!(
            cfg.rate_limits.api_per_minute,
            RateLimits::default().api_per_minute
        );
        let zero = config(&[("UAR_UPSTREAM", "http://uar"), ("CHAT_BURST", "0")]);
        assert!(matches!(
            zero,
            Err(ConfigError::InvalidNumber {
                name: "CHAT_BURST",
                ..
            })
        ));
    }

    #[test]
    fn missing_or_short_session_secret_should_refuse_to_start() {
        let missing = config(&[("UAR_UPSTREAM", "http://uar"), ("SITE_SESSION_SECRET", "")]);
        assert!(matches!(missing, Err(ConfigError::MissingSessionSecret)));
        let short = config(&[
            ("UAR_UPSTREAM", "http://uar"),
            ("SITE_SESSION_SECRET", &SECRET[1..]),
        ]);
        assert!(matches!(short, Err(ConfigError::WeakSessionSecret)));
    }

    #[test]
    fn meter_defaults_should_be_the_d3_budgets_and_n_of_5000() {
        let cfg = config(&[("UAR_UPSTREAM", "http://uar")]).unwrap();
        assert_eq!(
            (
                cfg.meter.budgets.daily,
                cfg.meter.budgets.monthly,
                cfg.meter.reservation_tokens
            ),
            (1_000_000, 20_000_000, 5_000)
        );
        assert_eq!(
            (
                cfg.meter.store.namespace.as_str(),
                cfg.meter.store.database.as_str()
            ),
            ("site", "meter")
        );
        assert!(!format!("{:?}", cfg.meter).contains("meter-pass"));
    }

    #[test]
    fn meter_settings_should_be_validated() {
        let with = |name: &'static str, value: &'static str| {
            config(&[("UAR_UPSTREAM", "http://uar"), (name, value)])
        };
        assert!(matches!(
            with("SITE_METER_RESERVATION_TOKENS", "2000000"),
            Err(ConfigError::InvalidMeterSizes)
        ));
        assert!(matches!(
            with("SITE_METER_RESERVATION_TOKENS", "0"),
            Err(ConfigError::InvalidMeterSizes)
        ));
        assert!(matches!(
            with("SITE_METER_URL", "https://surreal"),
            Err(ConfigError::InvalidMeterUrl(_))
        ));
        assert!(matches!(
            with("SITE_METER_PASS", ""),
            Err(ConfigError::Missing("SITE_METER_PASS"))
        ));
        assert!(matches!(
            with("SITE_KILL_SWITCH_FILE", ""),
            Err(ConfigError::Missing("SITE_KILL_SWITCH_FILE"))
        ));
        let small = with("SITE_METER_RESERVATION_TOKENS", "300").unwrap();
        assert_eq!(small.meter.reservation_tokens, 300);
    }

    #[test]
    fn missing_upstream_should_fail() {
        assert!(matches!(config(&[]), Err(ConfigError::MissingUpstream)));
    }

    #[test]
    fn https_upstream_should_fail() {
        assert!(matches!(
            config(&[("UAR_UPSTREAM", "https://uar")]),
            Err(ConfigError::InvalidUpstream(_))
        ));
    }
}
