// TJ-ARCH-MOB-001 compliant
//! Binary entry point: config, JSON logs, serve, graceful shutdown.

use std::net::{Ipv4Addr, SocketAddr};
use std::process::ExitCode;

use knowme_site_server::build_app;
use knowme_site_server::config::Config;
use tracing_subscriber::EnvFilter;

#[tokio::main]
async fn main() -> ExitCode {
    tracing_subscriber::fmt()
        .json()
        .with_env_filter(
            EnvFilter::try_from_default_env().unwrap_or_else(|_| EnvFilter::new("info")),
        )
        .init();

    match run().await {
        Ok(()) => ExitCode::SUCCESS,
        Err(err) => {
            tracing::error!(error = %err, "knowme-site-server failed");
            ExitCode::FAILURE
        }
    }
}

async fn run() -> Result<(), Box<dyn std::error::Error>> {
    let config = Config::from_env()?;
    if config.site_proxy_api_key.is_none() {
        tracing::warn!("SITE_PROXY_API_KEY is unset; UAR will see proxied calls as anonymous");
    }
    let app = build_app(&config)?;
    let addr = SocketAddr::from((Ipv4Addr::UNSPECIFIED, config.port));
    let listener = tokio::net::TcpListener::bind(addr).await?;
    tracing::info!(
        %addr,
        upstream = %config.uar_upstream,
        agent = %config.site_agent_id,
        trusted_proxy_hops = config.trusted_proxy_hops,
        external_web_root = ?config.web_root,
        "listening"
    );
    axum::serve(
        listener,
        app.into_make_service_with_connect_info::<SocketAddr>(),
    )
    .with_graceful_shutdown(shutdown_signal())
    .await?;
    tracing::info!("shut down");
    Ok(())
}

/// Resolves on SIGTERM (Kubernetes, docker stop) or Ctrl-C. In-flight SSE
/// streams keep the drain open until they end or the pod's grace period
/// expires.
async fn shutdown_signal() {
    let ctrl_c = async {
        if let Err(err) = tokio::signal::ctrl_c().await {
            tracing::error!(error = %err, "cannot listen for Ctrl-C");
            std::future::pending::<()>().await;
        }
    };
    #[cfg(unix)]
    let terminate = async {
        match tokio::signal::unix::signal(tokio::signal::unix::SignalKind::terminate()) {
            Ok(mut sigterm) => {
                sigterm.recv().await;
            }
            Err(err) => {
                tracing::error!(error = %err, "cannot listen for SIGTERM");
                std::future::pending::<()>().await;
            }
        }
    };
    #[cfg(not(unix))]
    let terminate = std::future::pending::<()>();

    tokio::select! {
        () = ctrl_c => {},
        () = terminate => {},
    }
    tracing::info!("shutdown signal received; draining");
}
