// TJ-ARCH-MOB-001 compliant
//! The A2UI opt-in switch: an operator-owned file, path from
//! `SITE_A2UI_OPTIN_FILE`.
//!
//! The file holds `on` or `off` (trimmed, any case). Only a readable file
//! that says `on` enables A2UI: no configured path, a missing or unreadable
//! file, or any other content is off. That is the opposite default of the
//! chat kill switch on purpose, because A2UI is an additive capability whose
//! safe state is the plain text stream. The switch starts off and is
//! re-read every [`POLL_INTERVAL`], so a ConfigMap change takes effect with
//! no redeploy and no restart.

use std::path::{Path, PathBuf};
use std::sync::Arc;
use std::sync::atomic::{AtomicBool, Ordering};
use std::time::Duration;

pub const POLL_INTERVAL: Duration = Duration::from_secs(10);

#[derive(Debug)]
pub struct A2uiOptIn {
    path: Option<PathBuf>,
    enabled: AtomicBool,
}

impl A2uiOptIn {
    /// Starts off, then reads the file once. `None` means there is no file
    /// variable, which is permanently off.
    pub fn new(path: Option<PathBuf>) -> Self {
        let switch = Self {
            path,
            enabled: AtomicBool::new(false),
        };
        switch.refresh();
        switch
    }

    /// True while chat turns may ask UAR for A2UI surfaces.
    pub fn is_enabled(&self) -> bool {
        self.enabled.load(Ordering::Relaxed)
    }

    pub fn refresh(&self) {
        let Some(path) = &self.path else { return };
        let enabled = read_state(path);
        let was = self.enabled.swap(enabled, Ordering::Relaxed);
        if was != enabled {
            tracing::warn!(
                alert = "a2ui_optin_changed",
                enabled,
                "A2UI opt-in {}",
                if enabled { "on" } else { "off" }
            );
        }
    }

    /// Polls the file until the switch is dropped. A switch with no path has
    /// nothing to poll.
    pub fn spawn_watcher(switch: &Arc<Self>) {
        if switch.path.is_none() {
            return;
        }
        let weak = Arc::downgrade(switch);
        tokio::spawn(async move {
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
        Ok(text) => text.trim().eq_ignore_ascii_case("on"),
        // A missing file is the normal OFF state (the ConfigMap is optional).
        Err(_) => false,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn temp_file(name: &str, contents: Option<&str>) -> PathBuf {
        let path =
            std::env::temp_dir().join(format!("knowme-a2ui-optin-{}-{name}", std::process::id()));
        let _ = std::fs::remove_file(&path);
        if let Some(contents) = contents {
            std::fs::write(&path, contents).unwrap();
        }
        path
    }

    #[test]
    fn only_a_readable_on_should_enable() {
        assert!(A2uiOptIn::new(Some(temp_file("on", Some(" ON\n")))).is_enabled());
        assert!(!A2uiOptIn::new(Some(temp_file("off", Some("off")))).is_enabled());
        assert!(!A2uiOptIn::new(Some(temp_file("junk", Some("true")))).is_enabled());
        assert!(!A2uiOptIn::new(Some(temp_file("empty", Some("")))).is_enabled());
        assert!(!A2uiOptIn::new(Some(temp_file("missing", None))).is_enabled());
        assert!(!A2uiOptIn::new(None).is_enabled());
    }

    #[test]
    fn refresh_should_follow_the_file() {
        let path = temp_file("flip", Some("off"));
        let switch = A2uiOptIn::new(Some(path.clone()));
        assert!(!switch.is_enabled());
        std::fs::write(&path, "on").unwrap();
        switch.refresh();
        assert!(switch.is_enabled());
        std::fs::remove_file(&path).unwrap();
        switch.refresh();
        assert!(!switch.is_enabled());
    }
}
