// TJ-ARCH-MOB-001 compliant
//! The chat kill switch (FR-36): a file mounted from an operator-owned
//! ConfigMap, path from `SITE_KILL_SWITCH_FILE`.
//!
//! The file holds `on` or `off` (trimmed, any case). Only a readable file
//! that says `off` lets turns through: missing, unreadable or any other
//! content is `on`. The switch starts `on` and is re-read every
//! [`POLL_INTERVAL`]; kubelet propagates a ConfigMap change to the mount
//! within about a minute, so the offline state follows a change with no
//! redeploy and no pod restart.

use std::path::{Path, PathBuf};
use std::sync::Arc;
use std::sync::atomic::{AtomicBool, Ordering};
use std::time::Duration;

/// Re-read interval. With kubelet's sync delay, the switch takes effect
/// within the 60 s FR-36 allows on the next poll after the mount updates.
pub const POLL_INTERVAL: Duration = Duration::from_secs(10);

#[derive(Debug)]
pub struct KillSwitch {
    path: PathBuf,
    engaged: AtomicBool,
}

impl KillSwitch {
    /// Starts `on`, then reads the file once.
    pub fn new(path: PathBuf) -> Self {
        let switch = Self {
            path,
            engaged: AtomicBool::new(true),
        };
        switch.refresh();
        switch
    }

    /// True while chat turns must be refused.
    pub fn is_engaged(&self) -> bool {
        self.engaged.load(Ordering::Relaxed)
    }

    pub fn refresh(&self) {
        let engaged = read_state(&self.path);
        let was = self.engaged.swap(engaged, Ordering::Relaxed);
        if was != engaged {
            tracing::warn!(
                alert = "kill_switch_changed",
                engaged,
                "chat kill switch {}",
                if engaged { "on" } else { "off" }
            );
        }
    }

    /// Polls the file until the switch is dropped.
    pub fn spawn_watcher(switch: &Arc<Self>) {
        let weak = Arc::downgrade(switch);
        tokio::spawn(async move {
            // `new` already read the file; the first poll is one interval later
            // (a plain `interval` would tick at once and re-read redundantly).
            let mut tick = tokio::time::interval_at(
                tokio::time::Instant::now() + POLL_INTERVAL,
                POLL_INTERVAL,
            );
            loop {
                tick.tick().await;
                let Some(switch) = weak.upgrade() else { break };
                switch.refresh();
            }
        });
    }
}

fn read_state(path: &Path) -> bool {
    match std::fs::read_to_string(path) {
        Ok(text) => parse_state(&text).unwrap_or_else(|| {
            tracing::warn!("kill switch file holds neither `on` nor `off`; treating it as on");
            true
        }),
        Err(err) => {
            tracing::warn!(error = %err, "kill switch file unreadable; treating it as on");
            true
        }
    }
}

/// `Some(true)` for on, `Some(false)` for off, `None` otherwise.
fn parse_state(text: &str) -> Option<bool> {
    match text.trim().to_ascii_lowercase().as_str() {
        "on" => Some(true),
        "off" => Some(false),
        _ => None,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn temp_file(name: &str, contents: Option<&str>) -> PathBuf {
        let path =
            std::env::temp_dir().join(format!("knowme-kill-switch-{}-{name}", std::process::id()));
        let _ = std::fs::remove_file(&path);
        if let Some(contents) = contents {
            std::fs::write(&path, contents).unwrap();
        }
        path
    }

    #[test]
    fn only_a_readable_off_should_disengage() {
        assert_eq!(parse_state(" OFF\n"), Some(false));
        assert_eq!(parse_state("on"), Some(true));
        assert_eq!(parse_state("false"), None);
        assert_eq!(parse_state(""), None);

        assert!(!KillSwitch::new(temp_file("off", Some("off\n"))).is_engaged());
        assert!(KillSwitch::new(temp_file("on", Some("on"))).is_engaged());
        assert!(KillSwitch::new(temp_file("junk", Some("0"))).is_engaged());
        assert!(KillSwitch::new(temp_file("missing", None)).is_engaged());
    }

    #[test]
    fn refresh_should_follow_the_file() {
        let path = temp_file("flip", Some("off"));
        let switch = KillSwitch::new(path.clone());
        assert!(!switch.is_engaged());
        std::fs::write(&path, "on").unwrap();
        switch.refresh();
        assert!(switch.is_engaged());
        std::fs::remove_file(&path).unwrap();
        switch.refresh();
        assert!(switch.is_engaged());
    }
}
